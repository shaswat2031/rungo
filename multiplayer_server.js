require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/striderealm';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ DB Connection Error:', err));

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'ok',
        server: 'online',
        database: dbStatus,
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// --- SCHEMAS ---

const TerritorySchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userId: String,
    team: String,
    area: Number,
    path: [{ latitude: Number, longitude: Number }],
    color: String,
    city: String,
    timestamp: { type: Date, default: Date.now },
    location: {
        type: { type: String, enum: ['Polygon'], default: 'Polygon' },
        coordinates: [[[Number]]] // [[ [lng, lat], [lng, lat] ]]
    }
});
TerritorySchema.index({ location: '2dsphere' });
const Territory = mongoose.model('Territory', TerritorySchema);

const UserSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    totalArea: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    loopCount: { type: Number, default: 0 },
    longestRun: { type: Number, default: 0 },
    team: String
});
const User = mongoose.model('User', UserSchema);

const HotZoneSchema = new mongoose.Schema({
    id: String,
    lat: Number,
    lng: Number,
    radius: Number,
    title: String,
    multiplier: Number,
    type: { type: String, default: 'multiplier' },
    color: { type: String, default: '#FF7A00' }
});
const HotZone = mongoose.model('HotZone', HotZoneSchema);

// --- STATE (Memory for ephemeral active paths) ---
let activeCaptures = {}; // { userId: { path, lastUpdate } }

// --- SEED SECTOR (Add default hot zones if they don't exist) ---
const seedHotZones = async () => {
    const count = await HotZone.countDocuments();
    if (count === 0) {
        await HotZone.insertMany([
            // Surat - Launch Focus
            { id: 's1', lat: 21.1702, lng: 72.8311, radius: 1000, title: 'Surat Center', multiplier: 2.5, type: 'multiplier', color: '#00FFCC' },
            { id: 's2', lat: 21.1274, lng: 72.7153, radius: 1500, title: 'Dumas Beach Loop', multiplier: 3.0, type: 'event', color: '#FF007A' },
            { id: 's3', lat: 21.1748, lng: 72.7844, radius: 800, title: 'VR Mall Hotspot', multiplier: 2.0, type: 'multiplier', color: '#FFCB00' },
            { id: 's4', lat: 21.1923, lng: 72.8155, radius: 600, title: 'Surat Castle', multiplier: 2.2, type: 'multiplier', color: '#8F00FF' },

            // Other Cities
            { id: 'h1', lat: 12.9716, lng: 77.5946, radius: 500, title: 'Bangalore Hub', multiplier: 2.5, type: 'multiplier', color: '#FF7A00' },
            { id: 'h2', lat: 19.0760, lng: 72.8777, radius: 800, title: 'Mumbai Front', multiplier: 3.0, type: 'multiplier', color: '#FF2D55' },
        ]);
        console.log('🔥 Seeded Surat Focus Hot Zones');
    }
};
seedHotZones();

// --- AUTH ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
    console.log('📝 Registration attempt:', req.body.email, req.body.username);
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            console.log('❌ Missing fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = `user_${Math.random().toString(36).substr(2, 9)}`;

        const newUser = new User({
            userId,
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { userId, username, email } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    console.log('🔑 Login attempt:', req.body.email);
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.userId, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { userId: user.userId, username: user.username, email: user.email } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- ENDPOINTS ---

// Hot Zones
app.get('/api/zones', async (req, res) => {
    try {
        const zones = await HotZone.find();
        res.json(zones);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Leaderboards (Aggregated from User table)
app.get('/api/leaderboard/:city', async (req, res) => {
    try {
        const city = req.params.city;
        let query = {};

        // If it's not 'India' or 'Global', we filter by city
        if (city && city !== 'India' && city !== 'Global' && city !== 'Detecting...') {
            query = { city: new RegExp(city, 'i') };
        }

        // For 'India', we could filter users by country if we had that field, 
        // but for now we'll treat it as a wider reach or just return top global.

        const topUsers = await User.find(query).sort({ totalArea: -1 }).limit(10);
        res.json(topUsers.map((u, i) => ({
            id: u.userId,
            name: u.username || (u.email ? u.email.split('@')[0] : 'Runner'),
            team: u.team || 'Neon',
            area: Number((u.totalArea / 1000000).toFixed(2))
        })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Active Capture Sync
app.post('/api/active', (req, res) => {
    const { userId, path, isCapturing } = req.body;
    if (isCapturing) {
        activeCaptures[userId] = { userId, path, lastUpdate: Date.now() };
    } else {
        delete activeCaptures[userId];
    }
    res.sendStatus(200);
});

app.get('/api/active', (req, res) => {
    const now = Date.now();
    Object.keys(activeCaptures).forEach(id => {
        if (now - activeCaptures[id].lastUpdate > 15000) {
            delete activeCaptures[id];
        }
    });
    res.json(Object.values(activeCaptures));
});

// Territory Claims
app.post('/api/claim', async (req, res) => {
    const { territory, userId, stats } = req.body;
    try {
        // 1. Save Territory
        const newTerritory = new Territory({
            ...territory,
            userId,
            city: territory.city || 'Unknown',
            location: {
                type: 'Polygon',
                coordinates: [territory.path.map(p => [p.longitude, p.latitude])]
            }
        });
        await newTerritory.save();

        // 2. Update User Stats
        await User.findOneAndUpdate(
            { userId },
            {
                $set: { ...stats },
                $inc: { loopCount: 1 }
            },
            { upsert: true, new: true }
        );

        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/territories', async (req, res) => {
    try {
        const territories = await Territory.find().limit(100).sort({ timestamp: -1 });
        res.json(territories);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const os = require('os');
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
};

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 For mobile connection, use: http://${getLocalIP()}:${PORT}/api`);
});

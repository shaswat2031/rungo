# StrideRealm Deployment & Production Database Guide

To move StrideRealm from a "Local Testing" phase to a "Production" environment, you need to transition from in-memory arrays to a persistent database and host your backend on a cloud provider.

## 🏗️ 1. Infrastructure Roadmap

| Component | Current (Local) | Production (Cloud) |
| :--- | :--- | :--- |
| **Backend API** | Node.js (Localhost) | **Render / Heroku / AWS EC2** |
| **Database** | Memory (JS Arrays) | **MongoDB / PostgreSQL / Redis** |
| **Mobile App** | Expo Go | **EAS Build (APK / IPA)** |
| **Map Engine** | Mapbox Standard | **Mapbox Production Key** |

---

## 🗄️ 2. Database Integration (Recommended: MongoDB)

For a geospatial game like RunRealm, **MongoDB** is excellent because of its native **2dsphere indices** (perfect for "Players near me" queries).

### Step 1: Install Mongoose
```bash
npm install mongoose
```

### Step 2: Production Server Structure
Replace the arrays in `multiplayer_server.js` with Mongoose Models:

```javascript
// models/Territory.js
const territorySchema = new mongoose.Schema({
  userId: String,
  team: String,
  area: Number,
  path: [{ latitude: Number, longitude: Number }],
  location: {
    type: { type: String, default: 'Polygon' },
    coordinates: [[[Number]]] // Geospatial Polygon
  }
});
```

---

## 🚀 3. Backend Deployment (e.g., Render.com)

1. **Move Secret Keys to Environment Variables**:
   In your server code, replace hardcoded strings:
   ```javascript
   const PORT = process.env.PORT || 3000;
   const MONGO_URI = process.env.DATABASE_URL;
   ```
2. **Push to GitHub**: Render/Heroku will auto-deploy every time you push.
3. **Set Environment Variables**: In the Render dashboard, add your `DATABASE_URL`.

---

## 📱 4. Mobile App Production (EAS Build)

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **Configure App**: 
   ```bash
   eas build:configure
   ```
3. **Production URL**:
   Change `BASE_API_URL` in `index.tsx` and `explore.tsx` to your deployed Render URL (e.g., `https://runrealm-api.onrender.com/api`).
4. **Build the APK**:
   ```bash
   eas build --platform android --profile preview
   ```

---

## ⚡ 5. Real-Time Optimization (Redis)

Because RunRealm uses **Polling**, high traffic can slow down a standard database. 
*   **The Pro Move**: Use **Redis** to store "Active Captures" (temporary data).
*   **Persistent Move**: Only write to **MongoDB** when a loop is successfully closed (permanent data).

---

## 🛠️ Next Steps for the Developer
1. **Host a MongoDB cluster** (free on MongoDB Atlas).
2. **Deploy the server** to Render.com (free tier available).
3. **Update the App** to point to the new URL.
4. **Run `eas build`** to get your installable file!

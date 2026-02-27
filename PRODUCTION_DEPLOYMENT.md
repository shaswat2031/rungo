# 🚀 StrideRealm Full Deployment Guide

This guide covers the 3 major steps to take StrideRealm live: GitHub setup, Backend Deployment, and Mobile App Publishing.

---

## 🏗️ Step 1: GitHub Repository Setup
1. **Initialize Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit StrideRealm"
   ```
2. **Create Repository**: Go to [GitHub](https://github.com/new) and create a private or public repo named `StrideRealm`.
3. **Push Code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/StrideRealm.git
   git branch -M main
   git push -u origin main
   ```

---

## 🗄️ Step 2: Production Database (MongoDB Atlas)
1. **Register**: Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Create Cluster**: Choose the **Free Tier (Shared)**.
3. **Network Access**: 
   - Go to "Network Access" -> "Add IP Address".
   - Select **"Allow Access From Anywhere"** (0.0.0.0/0) so Render can connect.
4. **Database User**: Create a user with a username and password (keep these safe).
5. **Connection String**: Click "Connect" -> "Connect your application" and copy the `mongodb+srv://...` URL.

---

## 🌐 Step 3: Backend Deployment (Render.com)
1. **Login**: Sign up at [Render](https://render.com) using your GitHub account.
2. **New Service**: Click "New" -> **"Web Service"**.
3. **Connect Repo**: Select your `StrideRealm` repository.
4. **Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node multiplayer_server.js`
5. **Environment Variables**: Add these in the Render "Env Vars" tab:
   - `MONGODB_URI`: *Your MongoDB Atlas connection string*
   - `JWT_SECRET`: *A long random string*
   - `PORT`: `3000`
6. **Deploy**: Render will automatically build and give you a URL (e.g., `https://rungo.onrender.com`).

---

## 📱 Step 4: Mobile App Build (Expo EAS)
1. **Update API URL**: In `constants/Config.ts`, change `BASE_API_URL` to your Render URL.
2. **Install EAS CLI**: 
   ```bash
   npm install -g eas-cli
   ```
3. **Login to Expo**: 
   ```bash
   eas login
   ```
4. **Configure Project**:
   ```bash
   eas build:configure
   ```
5. **Build for Android (APK)**:
   ```bash
   eas build -p android --profile preview
   ```
   *This will give you a downloadable .apk file you can share.*

---

## ✅ Post-Deployment Checklist
- [ ] Backend is "Live" on Render.
- [ ] MongoDB Atlas shows a connection from Render.
- [ ] `BASE_API_URL` in the app matches the Render URL.
- [ ] Users can Signup/Login on the production build.

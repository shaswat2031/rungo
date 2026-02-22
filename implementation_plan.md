# Implementation Plan - RunRealm

## Overview
RunRealm is a GPS-based territory capture game. This plan outlines the phased development of the core mechanics, focusing on the frontend (React Native/Expo) and the geospatial logic.

## Phase 1: Foundation & Setup
- [ ] Install core dependencies:
  - `@rnmapbox/maps` (Mapping)
  - `expo-location` (GPS tracking)
  - `@turf/turf` (Geospatial calculations)
  - `lucide-react-native` (Icons)
- [ ] Configure Mapbox for Expo (Development Build requirement).
- [ ] Create a custom dark-themed map style (Premium Aesthetic).

## Phase 2: Core Mechanics - Capture Logic
- [ ] **GPS Tracking Engine**:
  - Implement background/foreground location tracking.
  - Filter GPS drift and handle low-accuracy pings.
- [ ] **Path Drawing**:
  - Visualize the user's current path as a "trail" on the map.
- [ ] **Loop Detection**:
  - Logic to check if the current position is close to the starting point of the current path.
  - Threshold-based closure (e.g., within 10-20 meters).
- [ ] **Area Calculation**:
  - Convert points to a Turf Polygon.
  - Validate polygon (no self-intersections).
  - Calculate area in square meters/kilometers.

## Phase 3: Game State & Persistence
- [ ] **Local Storage**:
  - Store captured territories locally using `AsyncStorage` or `SQLite` for offline play.
- [ ] **Mock Backend**:
  - Create a service layer to simulate API calls for "territories of other players".
- [ ] **Energy System**:
  - Implement daily distance quota.

## Phase 4: UI/UX Refinement
- [ ] **Capture Animation**:
  - "Flash" or "Fill" animation when a loop is closed.
- [ ] **Dashboard**:
  - Stats for "Total Area Captured", "Today's Distance", "Energy Remaining".
- [ ] **Leaderboard Mockup**:
  - Show local dominance.

## Phase 5: Anti-Cheat & Security
- [ ] **Speed Validation**:
  - Detect spikes > 20 km/h (running/cycling speed limit).
- [ ] **Device Integrity**:
  - Basic checks for mock location providers.

## Phase 6: Backend Integration (Future)
- [ ] Node.js + Express/NestJS.
- [ ] PostgreSQL + PostGIS for spatial queries.
- [ ] Real-time updates via WebSockets (Socket.io).

## Technical Strategy
- **Turf.js**: Will be used for all geometric math on the client.
- **Expo Development Builds**: Since `@rnmapbox/maps` uses native code, we will need to use development builds (`npx expo run:android`).
- **Mapbox Studio**: Design a high-contrast "Cyberpunk" or "Minimalist Dark" map style.

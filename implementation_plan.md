# Implementation Plan - RunRealm

## Overview
RunRealm is a GPS-based territory capture game. This plan outlines the phased development of the core mechanics, focusing on the frontend (React Native/Expo) and the geospatial logic.

## Phase 1: Foundation & Setup
- [x] Install core dependencies:
  - `react-native-maps` (Mapping Alternative)
  - `expo-location` (GPS tracking)
  - `@turf/turf` (Geospatial calculations)
  - `lucide-react-native` (Icons)
- [x] Configure Maps for Expo.
- [x] Create a custom dark-themed map style.

## Phase 2: Core Mechanics - Capture Logic
- [x] **GPS Tracking Engine**:
  - Implement background/foreground location tracking.
- [x] **Path Drawing**:
  - Visualize the user's current path as a "trail" on the map.
- [x] **Loop Detection**:
  - Logic to check if the current position is close to start.
- [x] **Area Calculation**:
  - Convert points to a Turf Polygon and calculate area.

## Phase 3: Game State & Persistence (In Progress)
- [x] **Local Storage**:
  - Store captured territories locally using AsyncStorage.
- [ ] **Mock Backend**:
  - Create a service layer for other players.
- [x] **Energy System**:
  - Basic energy UI and logic implemented.

## Phase 4: UI/UX Refinement
- [x] **Dashboard**:
  - Stats for energy and levels.
- [x] **Capture UI**:
  - Neon pink/cyan toggle for capturing state.

## Phase 3: Gamification & Teams
- [x] XP and Leveling System
- [x] Day/Night Cycle (Optional)
- [x] Daily Missions & XP Rewards
- [x] Faction/Team selection (Neon vs Pink)

## Phase 4: Social & Competitive
- [x] City-wise Leaderboards
- [x] REST-based Multiplayer Sync
- [ ] Global Feed / Activity Stream
- [ ] Team Chat / Coordination
## Phase 5: Anti-Cheat & Security
- [x] **Speed Validation**:
  - Detect spikes > 8m/s (Vehicle detection).
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

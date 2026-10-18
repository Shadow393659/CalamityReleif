# Noor | Disaster Relief Coordination Platform (نور)

A robust, production-ready MERN stack disaster relief coordination and emergency dispatch platform engineered for high-consequence crisis response (cyclones, tidal surges, catastrophic flash floods).

---

## 🏗 Monorepo Architecture

```
noor-project/
├── backend/
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Local environment configuration
│   ├── package.json              # Express, Mongoose, Socket.io, Helmet, CORS
│   └── src/
│       ├── app.js                # Express app setup, security headers & error handlers
│       ├── server.js             # HTTP Server + Socket.io gateway + Graceful Shutdown
│       ├── config/
│       │   └── db.js             # Mongoose connection with lifecycle events & retry
│       ├── middleware/
│       │   ├── errorHandler.js   # Centralized Mongoose & HTTP error handler
│       │   └── notFound.js       # 404 handler
│       ├── models/
│       │   ├── DistressRequest.js   # GeoJSON 2dsphere, peopleCount, urgency triage
│       │   ├── ReliefCamp.js        # Shelter capacities, facilities, auto slot math
│       │   ├── ResourceInventory.js # Prepositioned supplies, warehouse coordinates
│       │   ├── User.js              # Responders, NGOs, roles, bcrypt hashing
│       │   └── index.js             # Centralized model registry
│       ├── routes/
│       │   ├── distressRoutes.js    # Geospatial search, status updates, assignment
│       │   ├── reliefCampRoutes.js  # Camps list, real-time occupancy updates
│       │   ├── inventoryRoutes.js   # Resource stock allocation & dispatch
│       │   └── authRoutes.js        # Registration, JWT authentication, responder list
│       ├── sockets/
│       │   └── socketHandler.js     # Real-time rooms (district, control room), live events
│       └── scripts/
│           └── seed.js              # Realistic coastal cyclone disaster scenario seeder
├── frontend/
│   ├── package.json              # React 18, Vite, Socket.io Client, Lucide
│   ├── vite.config.js            # Reverse proxy for /api and /socket.io
│   ├── index.html                # Typography (Plus Jakarta Sans & JetBrains Mono)
│   └── src/
│       ├── App.jsx               # Real-time crisis dashboard, SOS triage & camp cards
│       ├── App.css               # Clean dark mode styling, urgency indicators
│       ├── index.css             # Noor CSS custom properties & glassmorphism
│       └── main.jsx              # React DOM initialization
├── .gitignore
├── package.json                  # Root monorepo workspace scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI.

### 2. Configure Environment
Check `backend/.env` (pre-created with sensible defaults):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/noor_disaster_db
JWT_SECRET=noor_disaster_emergency_jwt_secret_key_prod_2026
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 3. Populate Database (Seed Realistic Coastal Cyclone Scenario)
Run the seed script to populate realistic disaster scenarios:
```bash
npm run seed
```
*Seeds Users (Admin, Dispatcher, Field Agents, Volunteers), Relief Camps with capacities, Logistics Inventories, and high-urgency Distress Calls across the Sundarbans Delta, Kendrapara, Paradip Port, Puri, and Balasore sectors.*

### 4. Run the Backend Server
```bash
npm run dev
# or from root: npm run backend
```
- REST API: `http://localhost:5000`
- Health Diagnostic: `http://localhost:5000/api/health`
- Real-time WebSockets: `ws://localhost:5000`

### 5. Run the Frontend Dashboard
```bash
npm run frontend
```
Opens the live Noor Disaster Operations Console at `http://localhost:5173`.

---

## 📡 REST API & Real-Time Endpoints

### Role-based accounts

Sign in at `/login` using a Citizen, NGO responder, or Administrator account. The role is verified against the account on the server and saved with the session so the correct portal is shown after sign-in. New accounts may be registered as Citizen or NGO; administrator accounts are provisioned separately and cannot be created from the registration form.

To create an administrator without clearing existing application data, run `npm run create-admin` from the `backend` directory after setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` (optionally set `ADMIN_NAME`). It creates a new account and refuses to change an existing account. To intentionally reset an existing `System Admin` account, also set `ADMIN_RESET_PASSWORD=true`; it will not reset a non-admin account. The full `npm run seed` command also creates sample accounts, but it clears the existing disaster collections first.

| Role | Frontend access |
|---|---|
| Citizen | Overview, submit SOS reports, and receive live updates for their own reports |
| NGO responder | Overview and field dispatch feed |
| Administrator | All portals, including command center and analytics |

The API and Socket.io connection enforce these roles independently of the frontend. Seeded sample accounts use the password `Password123!`; for example, the administrator account is `ayesha.rahman@noor-relief.org`. Change or remove sample credentials before deploying.

### 1. Distress Requests (`/api/distress`)
- `GET /api/distress` - List distress calls for NGO responders and administrators (supports `?urgencyLevel=...`, `?status=...`, `?districtZone=...`, and proximity queries `?lng=88.10&lat=21.66&maxDistance=50000`).
- `POST /api/distress` - Register a new emergency call (broadcasts `distress:created` over Socket.io).
- `GET /api/distress/:id` - Get distress record details with timeline audit trail.
- `PATCH /api/distress/:id/status` - Update triage status (`In Progress`, `Resolved`, etc.) and append to timeline.
- `PATCH /api/distress/:id/assign` - Assign distress call to a responder or NGO team.

### 2. Relief Camps & Shelters (`/api/camps`)
- `GET /api/camps` - Query shelter locations, available slots, and medical facilities.
- `POST /api/camps` - Register a new emergency shelter.
- `PATCH /api/camps/:id/occupancy` - Live occupancy count update (broadcasts `camp:occupancy_changed`).

### 3. Resource Inventory & Warehouses (`/api/inventory`)
- `GET /api/inventory` - Prepositioned supply levels across coastal hubs.
- `POST /api/inventory` - Log new incoming aid supplies.
- `PATCH /api/inventory/:id/dispatch` - Allocate supplies to rescue missions.

### 4. Authentication & Responders (`/api/auth`)
- `POST /api/auth/register` - Register volunteer or field agent.
- `POST /api/auth/login` - Secure login returning JWT.
- `GET /api/auth/responders` - Available field agents directory for dispatch.

---

## ⚡ Socket.io Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join:district` | Client -> Server | `districtName` | Subscribes client to district-specific alerts |
| `join:control_room` | Client -> Server | None | Subscribes to central command live stream |
| `distress:created` | Server -> Client | `DistressRequest` | Emitted when a new citizen SOS is logged |
| `distress:updated` | Server -> Client | `DistressRequest` | Emitted when status or urgency changes |
| `distress:claimed` | Server -> Client | `DistressRequest` | Emitted when assigned to a responder |
| `camp:occupancy_changed` | Server -> Client | `ReliefCamp` | Live shelter capacity counter update |
| `inventory:updated` | Server -> Client | `ResourceInventory` | Real-time supply level adjustment |

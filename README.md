# 🚗 Verified Community Carpooling Platform

A community-based carpooling platform for sharing existing or planned journeys and their associated travel costs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS (JavaScript) |
| Backend | Node.js + Express.js (JavaScript) |
| Database | MySQL + Prisma ORM |
| Auth | JWT + bcrypt |

---

## Team Module Map

| Member | Domain |
|---|---|
| Member 1 | Auth · Community · Shared Foundations |
| Member 2 | Driver Commutes · Recurring Schedules · Matching |
| Member 3 | Passenger Requests · Bookings · Contribution Negotiation |
| Member 4 | Notifications · Ratings · Reports · Admin Dashboard |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- MySQL 8+
- npm

### 1. Clone and install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure environment

```bash
# server/.env
cp server/.env.example server/.env
# Fill in DATABASE_URL and JWT_SECRET

# client/.env
cp client/.env.example client/.env
```

### 3. Database setup

```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run in development

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client && npm run dev
```

---

## Shared File Rules

| File | Owner | Rule |
|---|---|---|
| `server/prisma/schema.prisma` | All (lead: Member 1) | PR required, all 4 review |
| `server/src/config/constants.js` | Member 1 | PR + notify all |
| `server/src/middleware/` | Member 1 | PR required |
| `server/src/utils/` | Member 1 | PR + discussion |
| `client/src/context/AuthContext.jsx` | Member 1 | PR required |
| `client/src/services/api.js` | Member 1 | PR required |

---

## Before Writing Feature Code — Agree On:
1. `prisma/schema.prisma` — all entities and relationships
2. `server/src/config/constants.js` — all status enums
3. `server/src/utils/ApiError.js` + `ApiResponse.js` — unified response format
4. JWT payload structure (`userId`, `role`, `communityId`)
# ShareWay

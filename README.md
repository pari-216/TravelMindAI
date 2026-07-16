# TravelMind AI

Your intelligent travel companion — plan smarter, explore further.

## Project Structure

```
travelmindai/
├── client/          → React + Vite frontend (TailwindCSS)
│   └── src/
│       ├── components/
│       ├── pages/        (Home, Login, Register, Dashboard)
│       ├── context/      (AuthContext)
│       ├── services/     (Axios API instance)
│       └── assets/
├── server/          → Node.js + Express backend
│   ├── config/      (MongoDB connection)
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env
└── README.md
```

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally or a remote connection string

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd travelmindai
```

### 2. Set up the server

```bash
cd server
cp .env .env.local   # Edit .env with your actual values
npm install
npm run dev           # Starts with nodemon on port 5000
```

The server exposes a health check at: **GET** `http://localhost:5000/api/health`

### 3. Set up the client

```bash
cd client
npm install
npm run dev           # Starts Vite dev server on port 5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables (server/.env)

| Variable       | Description                        |
| -------------- | ---------------------------------- |
| `PORT`         | Server port (default: `5000`)      |
| `MONGODB_URI`  | MongoDB connection string          |
| `JWT_SECRET`   | Secret key for JWT signing         |
| `AI_API_KEY`   | API key for AI service integration |

## Scripts

| Location  | Command         | Description                  |
| --------- | --------------- | ---------------------------- |
| `/server` | `npm run dev`   | Start server with nodemon    |
| `/server` | `npm start`     | Start server with node       |
| `/client` | `npm run dev`   | Start Vite dev server        |
| `/client` | `npm run build` | Build for production         |

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS v4, React Router, Axios
- **Backend:** Express, Mongoose, dotenv, cors, jsonwebtoken, bcryptjs

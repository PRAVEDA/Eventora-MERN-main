# Eventora - Production Deployment Guide

Refer to [Eventora-MERN-main/DEPLOYMENT.md](file:///Eventora-MERN-main/DEPLOYMENT.md) for complete instructions.

### Quick Summary:
- **Deploy Everything on Vercel (Single Project)**: Connect your repo to Vercel. `vercel.json` automatically builds the React Vite client and packages the Express backend as serverless functions with zero CORS configuration needed!
- **Frontend + Backend Decoupled**: Deploy `client` on [Vercel](https://vercel.com) and `server` on [Render](https://render.com).
- **Unified Single Service on Render/Railway**: Deploy with `npm run build:prod` and `npm run start:prod`.
- **Docker**: Run `docker compose up -d --build`.

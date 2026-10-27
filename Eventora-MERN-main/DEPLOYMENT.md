# Eventora - Production Deployment Guide

This guide covers deploying Eventora, including deploying the **entire project (Frontend + Backend) together on Vercel as a single application**.

---

## ⚡ Option 1: Deploy Entire Full-Stack App on Vercel (Single Project)
*Deploy both the React Vite frontend and the Express backend to a single Vercel project with one domain and zero CORS issues.*

### How It Works
- Vercel builds the React frontend with Vite.
- Vercel automatically wraps `server/server.js` as an auto-scaling serverless Node.js function handling all `/api/*` routes.
- The frontend talks directly to `/api` without needing cross-domain URLs.

### Step-by-Step Instructions:
1. **Push your project to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Vercel deployment"
   # push to your GitHub repo
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select your GitHub repository.
   - If your repository root is `Eventora-MERN-main`, set **Root Directory** to `Eventora-MERN-main` (or leave as `./` if your repo root already has `package.json`).
3. **Add Environment Variables in Vercel**:
   Under **Environment Variables**, add the following:
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_random_32_character_jwt_secret`
   - `EMAIL_USER`: `your_email@gmail.com`
   - `EMAIL_PASS`: `your_16_character_app_password`
   - `NODE_ENV`: `production`
4. **Click Deploy**:
   - Vercel will install dependencies, build the React SPA, and bundle the serverless Express API.
5. **Verify**:
   - Open your Vercel URL (e.g., `https://eventora.vercel.app`).
   - Check the API health check at `https://eventora.vercel.app/api/health`.

> [!IMPORTANT]
> **MongoDB Atlas Network Access**: Because Vercel serverless functions run across dynamic IP pools, make sure your MongoDB Atlas **Network Access** IP Whitelist includes `0.0.0.0/0` ("Allow access from anywhere").

---

## 🎯 Option 2: Decoupled (Vercel Frontend + Render Backend)
*Best for performance, free tiers, and automated preview deployments.*

### Step 1: Deploy Backend to Render
1. Push your code to a GitHub repository.
2. Sign in to [Render](https://render.com/) and click **New +** -> **Web Service**.
3. Connect your repository.
4. Configure the settings:
   - **Root Directory**: `Eventora-MERN-main/server`
   - **Environment**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps`
   - **Start Command**: `npm start`
5. In the **Environment Variables** section, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `your_mongodb_connection_string`
   - `JWT_SECRET`: `your_secure_random_jwt_secret_32_chars`
   - `CLIENT_URL`: `https://your-eventora-frontend.vercel.app` *(update once frontend is deployed)*
   - `EMAIL_USER`: `your_email@gmail.com`
   - `EMAIL_PASS`: `your_16_character_gmail_app_password`
6. Click **Create Web Service**. Once deployed, copy your Render URL (e.g., `https://eventora-api.onrender.com`).
7. Test the health check by opening: `https://eventora-api.onrender.com/api/health`.

### Step 2: Deploy Frontend to Vercel
1. Sign in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Root Directory**: click Edit and select `Eventora-MERN-main/client`.
   - **Framework Preset**: `Vite`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://eventora-api.onrender.com/api` *(your Render backend URL with `/api`)*
5. Click **Deploy**.
6. Once deployed, copy your Vercel URL (e.g. `https://eventora-client.vercel.app`), go back to Render, and update `CLIENT_URL` with this domain.

---

## 🚀 Option 2: Unified Single Service (Render or Railway)
*Easiest single-service deployment where one server serves both the React client and the Express API.*

1. Push your repository to GitHub.
2. On Render or Railway, create a **Web Service** connected to your repository.
3. Set the following build & start parameters:
   - **Root Directory**: `Eventora-MERN-main`
   - **Build Command**: `npm run build:prod`
   - **Start Command**: `npm run start:prod`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `your_mongodb_connection_string`
   - `JWT_SECRET`: `your_secure_random_jwt_secret`
   - `EMAIL_USER`: `your_email@gmail.com`
   - `EMAIL_PASS`: `your_16_character_app_password`
5. Click **Deploy**. The Express server will automatically serve both the React SPA from `/dist` and all endpoints under `/api`.

---

## 🐳 Option 3: Docker / VPS Deployment
*Ideal for DigitalOcean Droplets, AWS EC2, or self-hosted VPS servers.*

### Using Docker Compose
1. Ensure Docker & Docker Compose are installed on your server.
2. Set your environment variables in `.env`:
   ```bash
   cp server/.env.example .env
   # Edit .env with your values
   ```
3. Build and launch:
   ```bash
   docker compose up -d --build
   ```
4. Access your application at `http://your-server-ip:5000`.

---

## 🔒 Pre-Deployment Security Checklist
- [x] Security headers enabled via `helmet`.
- [x] Rate limiting configured on general API and sensitive auth endpoints.
- [x] Passwords hashed using `bcrypt` (10 rounds).
- [x] JWT sessions with expiration handling.
- [x] Client SPA rewrite rules configured for Vercel (`vercel.json`) and Netlify (`_redirects`).
- [x] Atomic concurrency guard on event seat allocation.
- [x] Clean error handling without stack trace leaks in production.
- [x] Health probe endpoint `/api/health` live.


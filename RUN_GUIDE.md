# KMCT Campus Connect - Execution Guide

This guide explains how to set up and run the Campus Connect Enterprise ERP system.

## 1. Prerequisites
Ensure you have the following installed on your system:
- **Node.js** (v18 or higher)
- **MongoDB** (Running locally or a remote URI)
- **PM2** (For production process management) - Install via `npm install -g pm2`

## 2. Initial Setup
Clone the repository and install dependencies for both frontend and backend:

```bash
# In the root directory (campus-connect)
npm install

# In the backend directory
cd backend
npm install
cd ..
```

## 3. Configuration
Ensure your environment variables are set up.
- **Backend**: Create/Update `backend/.env` with your `MONGODB_URI` and `JWT_SECRET`.
- **Frontend**: API calls are currently proxied to the backend.

## 4. Running the Application

### Option A: Development Mode (With Hot Reload)
Run these in two separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

### Option B: Production Mode (Using PM2)
This is the recommended way to run the application for actual use. It ensures the apps stay online even if they crash or the server restarts.

Use the provided ecosystem configuration:
```bash
# From the root directory
pm2 start ecosystem.config.cjs
```

## 5. Managing the Processes
Here are some helpful PM2 commands to monitor and manage the application:

| Command | Description |
|---------|-------------|
| `pm2 status` | View the status of all running processes |
| `pm2 restart all` | Restart both frontend and backend |
| `pm2 logs` | View real-time logs (errors/console output) |
| `pm2 stop all` | Stop the application |
| `pm2 delete all` | Remove the processes from the PM2 list |

## 6. Accessing the App
- **Frontend**: Typically runs on `http://localhost:5173` (Dev) or as configured in your Nginx/Hosting environment.
- **Backend API**: Accessible at `/api` from the frontend.

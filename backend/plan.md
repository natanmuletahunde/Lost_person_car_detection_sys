# Fix NetworkError on Signup - Action Plan

## Problem
Frontend receives `NetworkError when attempting to fetch resource` when trying to sign up.

## Root Causes & Solutions

### 1. Backend Server Not Running
**Fix:** Start the backend server:
```bash
cd backend
npm install  # if node_modules missing
npm start     # or node server.js
```
**Verify:** Open `http://localhost:5000/api/v1/health` in browser - should return `{"success": true, "message": "Server is running"}`

### 2. Wrong API URL in Frontend
**Fix:** Ensure frontend calls the correct endpoint:
```
POST http://localhost:5000/api/v1/auth/register
```
Check frontend `.env` or API config for `REACT_APP_API_URL` or similar.

### 3. CORS Misconfiguration
**Fix:** Update `.env` file in backend:
```
CORS_ORIGIN=http://localhost:3000
```
Replace `3000` with your frontend's actual port (e.g., 5173 for Vite, 3000 for CRA).

### 4. MongoDB Connection Failure
**Fix:** Ensure `.env` has valid `MONGODB_URI`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
```
If using local MongoDB: `MONGODB_URI=mongodb://localhost:27017/lost_person_car`

### 5. Test Signup Endpoint
Use Postman/curl to test backend directly:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"1234567890","password":"Test123!","confirmPassword":"Test123!"}'
```

## Verification Steps
1. Backend logs show `Server running in development mode on http://0.0.0.0:5000`
2. Backend logs show `✅ MongoDB connected...`
3. Health check endpoint returns success
4. Signup request from frontend succeeds

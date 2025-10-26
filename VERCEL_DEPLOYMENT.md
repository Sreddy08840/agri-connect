# Vercel Deployment Guide for AgriConnect

## Changes Made

### Web App
- ✅ Removed unused workspace dependencies
- ✅ Updated `vercel.json` configuration
- ✅ Ready for deployment

### Admin Portal
- ✅ Created `vercel.json` configuration
- ✅ Ready for deployment

## Deploy Steps

### 1. Deploy Web App

```powershell
cd c:\Users\sredd\Desktop\agri-connect1\apps\web
vercel --prod
```

**Environment Variables to Set in Vercel Dashboard:**
- `VITE_API_URL` = Your backend API URL (e.g., `https://your-api.com/api`)
- `VITE_SOCKET_URL` = Your Socket.IO server URL (e.g., `https://your-api.com`)
- `VITE_NODE_ENV` = `production`

### 2. Deploy Admin Portal

```powershell
cd c:\Users\sredd\Desktop\agri-connect1\apps\admin-portal
vercel --prod
```

**Environment Variables to Set in Vercel Dashboard:**
- `VITE_API_URL` = Your backend API URL (e.g., `https://your-api.com/api`)
- `VITE_SOCKET_URL` = Your Socket.IO server URL (e.g., `https://your-api.com`)

## Setting Environment Variables in Vercel

### Method 1: Via Dashboard
1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - Variable Name: `VITE_API_URL`
   - Value: `https://your-backend-url.com/api`
   - Environment: Production, Preview, Development

### Method 2: Via CLI (during deployment)
```powershell
vercel --prod -e VITE_API_URL=https://your-api.com/api -e VITE_SOCKET_URL=https://your-api.com
```

## Backend Deployment

Your backend API needs to be deployed separately. Options:

### Option 1: Railway.app
1. Go to https://railway.app
2. Create new project
3. Deploy from GitHub repository
4. Set environment variables

### Option 2: Heroku
1. Go to https://heroku.com
2. Create new app
3. Connect GitHub repository
4. Set environment variables

### Option 3: DigitalOcean App Platform
1. Go to https://cloud.digitalocean.com/apps
2. Create new app
3. Connect GitHub repository
4. Set environment variables

## Post-Deployment

After deploying:

1. **Update CORS settings** in your backend to allow requests from:
   - Your web app domain (e.g., `https://agriconnect-web.vercel.app`)
   - Your admin portal domain (e.g., `https://agriconnect-admin.vercel.app`)

2. **Test the deployment:**
   - Visit your deployed URLs
   - Check browser console for errors
   - Test API connections
   - Test Socket.IO connections

3. **Configure custom domains** (optional):
   - In Vercel Dashboard → Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check TypeScript compilation errors

### API Connection Fails
- Verify `VITE_API_URL` environment variable is set correctly
- Check backend CORS settings
- Ensure backend is deployed and accessible

### Socket.IO Connection Fails
- Verify `VITE_SOCKET_URL` environment variable is set correctly
- Check backend Socket.IO configuration
- Ensure WebSocket connections are allowed

## Next Deployment (Updates)

To deploy updates:

```powershell
# Web app
cd c:\Users\sredd\Desktop\agri-connect1\apps\web
vercel --prod

# Admin portal
cd c:\Users\sredd\Desktop\agri-connect1\apps\admin-portal
vercel --prod
```

Or push to your GitHub repository if you've set up automatic deployments.

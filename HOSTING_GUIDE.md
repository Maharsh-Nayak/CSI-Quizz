# Hosting Guide for PPC Project

## Project Overview
- **Type**: Node.js/Express web application
- **Backend**: Express server with Firebase Admin SDK
- **Frontend**: Static HTML files in `/public` directory
- **Database**: Firebase Firestore
- **Port**: Currently hardcoded to 3000 (needs environment variable)

---

## Prerequisites

### 1. Environment Variables Required
Create a `.env` file in the root directory with your Firebase service account credentials:

```env
type=service_account
project_id=your-project-id
private_key_id=your-private-key-id
private_key="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
client_email=your-service-account@project.iam.gserviceaccount.com
client_id=your-client-id
auth_uri=https://accounts.google.com/o/oauth2/auth
token_uri=https://oauth2.googleapis.com/token
auth_provider_x509_cert_url=https://www.googleapis.com/oauth2/v1/certs
client_x509_cert_url=https://www.googleapis.com/robot/v1/metadata/x509/...
universe_domain=googleapis.com
```

**Note**: Get these from Firebase Console → Project Settings → Service Accounts → Generate New Private Key

### 2. Update Server Configuration
The server currently hardcodes port 3000. Update `server.js` to use environment variable:

```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
});
```

---

## Hosting Options

### Option 1: Render (Recommended for Simplicity) ⭐

**Pros**: Free tier, easy setup, automatic HTTPS, GitHub integration
**Cons**: Free tier spins down after inactivity

#### Steps:
1. **Create a Render account** at https://render.com
2. **Connect your GitHub repository** (push your code to GitHub first)
3. **Create a new Web Service**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. **Add Environment Variables**:
   - Go to Environment tab
   - Add all Firebase credentials from your `.env` file
   - Add `NODE_ENV=production`
5. **Deploy**: Render will automatically deploy and provide a URL

**Note**: Render provides a `PORT` environment variable automatically.

---

### Option 2: Railway

**Pros**: Free tier, simple deployment, good for Node.js apps
**Cons**: Free tier has monthly credit limits

#### Steps:
1. **Sign up** at https://railway.app
2. **Create New Project** → Deploy from GitHub
3. **Configure**:
   - **Start Command**: `npm start`
4. **Add Environment Variables**:
   - Add all Firebase credentials
5. **Deploy**: Railway auto-detects Node.js and deploys

---

### Option 3: Google Cloud Run (Best for Firebase Integration)

**Pros**: Native Google Cloud integration, scales to zero, pay-per-use
**Cons**: Requires Google Cloud account setup

#### Steps:
1. **Install Google Cloud SDK** and login
2. **Create Dockerfile** (create this file):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
```

3. **Build and Deploy**:
```bash
gcloud builds submit --tag gcr.io/YOUR-PROJECT-ID/ppc
gcloud run deploy ppc --image gcr.io/YOUR-PROJECT-ID/ppc --platform managed --region us-central1
```

4. **Set Environment Variables** in Cloud Run console
5. **Update server.js** to use `process.env.PORT` (Cloud Run sets PORT=8080)

---

### Option 4: Vercel (For Serverless)

**Pros**: Excellent free tier, global CDN, automatic HTTPS
**Cons**: Requires converting Express app to serverless functions

#### Steps:
1. **Create `vercel.json`**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. **Install Vercel CLI**: `npm i -g vercel`
3. **Deploy**: `vercel`
4. **Add environment variables** in Vercel dashboard

---

### Option 5: DigitalOcean App Platform

**Pros**: Simple PaaS, good pricing, automatic HTTPS
**Cons**: Paid tier required for production

#### Steps:
1. **Sign up** at https://www.digitalocean.com
2. **Create App** → Connect GitHub repository
3. **Configure**:
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
4. **Add Environment Variables** in App Settings
5. **Deploy**

---

### Option 6: Traditional VPS (DigitalOcean, AWS EC2, etc.)

**Pros**: Full control, can run multiple apps
**Cons**: Requires server management, manual setup

#### Steps:
1. **Provision a VPS** (Ubuntu 20.04+ recommended)
2. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone your repository**:
```bash
git clone <your-repo-url>
cd PPC
npm install
```

4. **Create `.env` file** with Firebase credentials

5. **Install PM2** (process manager):
```bash
npm install -g pm2
pm2 start server.js --name ppc
pm2 save
pm2 startup
```

6. **Install Nginx** (reverse proxy):
```bash
sudo apt install nginx
```

7. **Configure Nginx** (`/etc/nginx/sites-available/ppc`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Enable site**: `sudo ln -s /etc/nginx/sites-available/ppc /etc/nginx/sites-enabled/`
9. **Setup SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Required Code Changes

### 1. Update `server.js` to use environment variable for port:

```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
    console.log(`Landing: http://localhost:${PORT}`);
    console.log(`Game: http://localhost:${PORT}/game`);
});
```

### 2. Update CORS if needed (currently allows all origins):
If you want to restrict CORS to your production domain:
```javascript
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*'
}));
```

### 3. Create `.gitignore` (if not exists):
```
node_modules/
.env
.DS_Store
*.log
```

---

## Firebase Configuration

Ensure your Firebase project:
1. Has Firestore Database enabled
2. Has a collection named `participants` (created automatically on first use)
3. Service account has proper permissions (Firestore Admin role)
4. Firestore security rules allow admin SDK access (admin SDK bypasses rules)

---

## Testing Before Deployment

1. **Test locally**:
```bash
npm install
# Create .env file with credentials
npm start
```

2. **Test endpoints**:
   - `http://localhost:3000/` - Landing page
   - `http://localhost:3000/game` - Game page
   - `http://localhost:3000/leaderboard` - Leaderboard
   - `POST http://localhost:3000/join` - Registration
   - `POST http://localhost:3000/submit-score` - Score submission
   - `GET http://localhost:3000/leaderboard` - Leaderboard API

---

## Recommended Hosting Choice

**For Beginners**: Render or Railway (easiest setup)
**For Production**: Google Cloud Run (best Firebase integration) or DigitalOcean App Platform
**For Learning/Full Control**: VPS with PM2 + Nginx

---

## Additional Considerations

1. **Domain Name**: Most platforms provide free subdomains. For custom domain, configure DNS
2. **SSL/HTTPS**: Most PaaS providers handle this automatically
3. **Monitoring**: Consider adding logging (e.g., Winston) for production
4. **Rate Limiting**: Consider adding rate limiting for production
5. **Error Handling**: Enhance error handling for production use

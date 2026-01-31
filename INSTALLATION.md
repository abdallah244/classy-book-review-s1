# 🚀 Installation Guide

<div align="center">

**Complete setup guide for Classy Book LMS**

[![Node](https://img.shields.io/badge/Node.js-18.x+-green.svg)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)]()

</div>

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Install](#quick-install)
- [Detailed Setup](#detailed-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version        | Download                            |
| -------- | -------------- | ----------------------------------- |
| Node.js  | 18.x or higher | [nodejs.org](https://nodejs.org/)   |
| npm      | 9.x or higher  | Included with Node.js               |
| Git      | Latest         | [git-scm.com](https://git-scm.com/) |

### Accounts Needed

| Service               | Purpose      | Sign Up                                                        |
| --------------------- | ------------ | -------------------------------------------------------------- |
| MongoDB Atlas         | Database     | [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) |
| Cloudinary (optional) | File storage | [cloudinary.com](https://cloudinary.com/)                      |

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check Git version
git --version
# Expected: git version 2.x.x
```

---

## ⚡ Quick Install

For experienced developers who want to get started quickly:

```bash
# Clone repository
git clone https://github.com/your-repo/classy-book.git
cd classy-book

# Install all dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# Create environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI

# Start both servers
cd backend && npm run start:dev &
cd frontend && npm run start
```

---

## 📖 Detailed Setup

### Step 1: Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/your-repo/classy-book.git

# Using SSH (if configured)
git clone git@github.com:your-repo/classy-book.git

# Navigate to project
cd classy-book
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

Expected output:

```
added 500+ packages, and audited 500+ packages in 30s
found 0 vulnerabilities
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

Expected output:

```
added 1000+ packages, and audited 1000+ packages in 45s
found 0 vulnerabilities
```

---

## ⚙️ Environment Configuration

### Backend Environment (.env)

Create `.env` file in the `backend` folder:

```bash
cd backend
touch .env  # On Windows: type nul > .env
```

Add the following configuration:

```env
# ===========================================
# DATABASE
# ===========================================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/classybook?retryWrites=true&w=majority

# ===========================================
# JWT CONFIGURATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret-also-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=7d

# ===========================================
# SERVER
# ===========================================
PORT=3000
NODE_ENV=development

# ===========================================
# ADMIN CREDENTIALS (Auto-seeded on first run)
# ===========================================
ADMIN_EMAIL=admin@classybook.com
ADMIN_PASSWORD=12345678

# ===========================================
# CORS
# ===========================================
CORS_ORIGIN=http://localhost:4200

# ===========================================
# REDIS (Optional - for caching)
# ===========================================
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=

# ===========================================
# CLOUDINARY (Optional - for file uploads)
# ===========================================
# CLOUDINARY_CLOUD_NAME=your-cloud-name
# CLOUDINARY_API_KEY=your-api-key
# CLOUDINARY_API_SECRET=your-api-secret
```

### Environment Variables Explained

| Variable                 | Required | Description                          |
| ------------------------ | -------- | ------------------------------------ |
| `MONGODB_URI`            | ✅       | MongoDB connection string            |
| `JWT_SECRET`             | ✅       | Secret for signing access tokens     |
| `JWT_EXPIRES_IN`         | ✅       | Access token expiry (e.g., 15m)      |
| `JWT_REFRESH_SECRET`     | ✅       | Secret for refresh tokens            |
| `JWT_REFRESH_EXPIRES_IN` | ✅       | Refresh token expiry (e.g., 7d)      |
| `PORT`                   | ❌       | Server port (default: 3000)          |
| `NODE_ENV`               | ❌       | Environment (development/production) |
| `ADMIN_EMAIL`            | ❌       | Primary admin email                  |
| `ADMIN_PASSWORD`         | ❌       | Primary admin password               |

### Generate Secure Secrets

```bash
# Generate random secret (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 64
```

---

## 🗄️ Database Setup

### MongoDB Atlas Setup

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free

2. **Create Cluster**
   - Click "Build a Cluster"
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and password
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere"
   - For production: Add your server's IP only
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" > "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `classybook`

Example connection string:

```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/classybook?retryWrites=true&w=majority
```

### Verify Database Connection

```bash
cd backend
npm run start:dev
```

Look for:

```
[Nest] LOG [MongooseModule] Successfully connected to MongoDB
```

---

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev
```

Expected output:

```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG Application is running on: http://localhost:3000
[Nest] LOG 🚀 API: http://localhost:3000/api/v1
[Nest] LOG 👤 Admin seeded: admin@classybook.com
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run start
```

Expected output:

```
✔ Compiled successfully.
** Angular Live Development Server is listening on localhost:4200 **
```

### Access Points

| Service     | URL                               |
| ----------- | --------------------------------- |
| Frontend    | http://localhost:4200             |
| Backend API | http://localhost:3000/api/v1      |
| Admin Login | http://localhost:4200/admin/login |

### Default Admin Credentials

| Field    | Value                |
| -------- | -------------------- |
| Email    | admin@classybook.com |
| Password | 12345678             |

---

## 🏗️ Production Build

### Build Backend

```bash
cd backend
npm run build
```

Output folder: `backend/dist/`

### Build Frontend

```bash
cd frontend
npm run build
```

Output folder: `frontend/dist/`

### Run Production

```bash
# Backend
cd backend
NODE_ENV=production npm run start:prod

# Serve Frontend with nginx, Apache, or any static server
```

---

## 🔧 Troubleshooting

### Common Issues

#### MongoDB Connection Error

```
MongooseServerSelectionError: Could not connect to any servers
```

**Solutions:**

1. ✅ Check your IP is whitelisted in MongoDB Atlas
2. ✅ Verify connection string is correct
3. ✅ Check internet connection
4. ✅ Ensure MongoDB Atlas cluster is running

```bash
# Get your current IP
curl ifconfig.me

# Add this IP to MongoDB Atlas Network Access
```

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

#### npm Install Errors

```
npm ERR! code ERESOLVE
```

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use legacy peer deps
npm install --legacy-peer-deps
```

#### CORS Errors

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

1. ✅ Ensure `CORS_ORIGIN` in `.env` matches your frontend URL
2. ✅ Restart backend after changing `.env`

#### JWT Errors

```
JsonWebTokenError: jwt malformed
```

**Solutions:**

1. ✅ Clear browser localStorage and sessionStorage
2. ✅ Login again to get fresh tokens

---

## 📞 Need Help?

If you're still having issues:

1. 📖 Check the [FAQ](./FAQ.md)
2. 🐛 Search [existing issues](https://github.com/your-repo/classy-book/issues)
3. 💬 Open a [new issue](https://github.com/your-repo/classy-book/issues/new)

---

<div align="center">

**Happy Coding! 🚀**

</div>

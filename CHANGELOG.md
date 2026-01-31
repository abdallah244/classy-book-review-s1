# 📋 Changelog

All notable changes to Classy Book will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-01-31

### 🎉 Initial Release

This is the first stable release of Classy Book LMS.

### ✨ Added

#### Backend

- **Authentication System**
  - JWT-based authentication with access and refresh tokens
  - Admin authentication endpoint (`/auth/admin/login`)
  - User authentication endpoint (`/auth/login`)
  - Token refresh mechanism
  - Secure logout

- **Security Features**
  - CSRF protection with token-based validation
  - Rate limiting to prevent brute-force attacks
  - IP blocking for malicious actors
  - Input sanitization (XSS & MongoDB injection prevention)
  - Helmet.js for HTTP security headers
  - Audit logging for all security events

- **Admin Management**
  - Primary admin seeder (auto-creates admin on first run)
  - Role-based access control (user, admin, super_admin)

- **Security Monitoring**
  - Real-time monitoring dashboard
  - Login attempt tracking
  - Blocked IP management
  - Security metrics API

- **Real-time Communication**
  - WebSocket gateway using Socket.IO
  - Monitoring room for admins
  - Real-time login attempt notifications
  - IP blocked/unblocked events

- **Database**
  - MongoDB Atlas integration
  - Mongoose schemas and models
  - Indexes for performance
  - TTL indexes for automatic cleanup

#### Frontend

- **Angular 21 Application**
  - Standalone components architecture
  - Angular Signals for state management
  - Lazy loading for optimal performance

- **Admin Panel**
  - Admin login page with validation
  - Admin dashboard with quick actions
  - Security monitoring page (real-time)

- **UI/UX Features**
  - Theme support (Light, Dark, System)
  - Internationalization (Arabic & English)
  - RTL support for Arabic
  - Responsive design

- **Session Management**
  - 15-minute session timer
  - Visual countdown in navbar
  - Session expiry warning
  - Automatic logout

- **WebSocket Integration**
  - Real-time connection to backend
  - Automatic reconnection
  - Event-based updates

### 🔐 Security

- All endpoints protected with JWT authentication
- Admin-only routes with role verification
- CSRF tokens for state-changing operations
- Rate limiting on authentication endpoints
- Automatic IP blocking after failed attempts
- Secure password hashing with bcrypt

### 📚 Documentation

- Comprehensive README.md
- API documentation
- Architecture documentation
- Security policy
- Contributing guidelines
- Changelog

---

## [Unreleased]

### 🔜 Planned Features

- [ ] Course management module
- [ ] Lesson creation and editing
- [ ] Student enrollment system
- [ ] Progress tracking
- [ ] Quiz and assessment system
- [ ] Certificate generation
- [ ] Email notifications
- [ ] File upload for course materials
- [ ] Video streaming integration
- [ ] Payment integration
- [ ] Reporting and analytics

---

## Version History

| Version | Date       | Status     |
| ------- | ---------- | ---------- |
| 1.0.0   | 2026-01-31 | ✅ Current |

---

## How to Update

```bash
# Backup your data first!
mongodump --uri="your-mongodb-uri" --out=backup/

# Pull latest changes
git pull origin main

# Update dependencies
cd backend && npm install
cd ../frontend && npm install

# Run migrations (if any)
npm run migration:run

# Rebuild and restart
npm run build
npm run start
```

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style
- `refactor:` Code refactoring
- `test:` Testing
- `chore:` Maintenance

---

<div align="center">

**[View all releases](https://github.com/your-repo/classy-book/releases)**

</div>

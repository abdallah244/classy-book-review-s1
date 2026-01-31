# 📚 Classy Book - Learning Management System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![NestJS](https://img.shields.io/badge/NestJS-11.x-red.svg)
![Angular](https://img.shields.io/badge/Angular-21.x-red.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**نظام إدارة تعلم متكامل وآمن**

[العربية](#arabic) | [English](#english)

</div>

---

<a name="english"></a>

## 🌟 Overview

Classy Book is a comprehensive Learning Management System (LMS) built with modern technologies and enterprise-grade security features. It provides a robust platform for educational institutions and organizations.

## 🛠️ Tech Stack

### Backend

- **Framework:** NestJS 11.x
- **Database:** MongoDB Atlas
- **Authentication:** JWT with Refresh Tokens
- **Real-time:** Socket.IO (WebSocket)
- **Caching:** Redis (optional)
- **File Upload:** Cloudinary

### Frontend

- **Framework:** Angular 21.x (Standalone Components)
- **Styling:** Custom CSS with Theme Support
- **State Management:** Angular Signals
- **i18n:** Arabic & English Support
- **Real-time:** Socket.IO Client

## 🔐 Security Features

| Feature                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| 🔑 JWT Authentication   | Secure token-based authentication with refresh tokens |
| 🛡️ CSRF Protection      | Cross-Site Request Forgery protection                 |
| 🚫 Rate Limiting        | Brute-force attack prevention                         |
| 🧹 Input Sanitization   | MongoDB injection & XSS protection                    |
| 🔒 Helmet               | HTTP security headers                                 |
| 📝 Audit Logging        | Comprehensive activity logging                        |
| 🌐 IP Blocking          | Automatic blocking of malicious IPs                   |
| 📊 Real-time Monitoring | Live security dashboard                               |

## 📁 Project Structure

```
classy-book/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── cloudinary/      # File upload service
│   │   ├── common/          # Shared modules (cache, pagination, queue)
│   │   ├── mongodb/         # Database utilities
│   │   ├── monitoring/      # Security monitoring
│   │   ├── performance/     # Performance features (realtime, search)
│   │   └── security/        # Security modules
│   │       ├── admin-management/  # Admin seeding & management
│   │       ├── auth/              # Authentication
│   │       ├── brute-force/       # Attack prevention
│   │       ├── csrf/              # CSRF protection
│   │       ├── rate-limit/        # Rate limiting
│   │       ├── sanitization/      # Input sanitization
│   │       └── sessions/          # Session management
│   └── test/
│
├── frontend/                # Angular Frontend
│   └── src/
│       └── app/
│           ├── core/        # Core services
│           │   └── services/
│           │       ├── auth.service.ts
│           │       ├── i18n.service.ts
│           │       ├── theme.service.ts
│           │       ├── session-timer.service.ts
│           │       └── websocket.service.ts
│           ├── pages/       # Application pages
│           │   └── admin-pages/
│           │       ├── admin-dashboard/
│           │       ├── admin-login/
│           │       └── general-monitoring/
│           └── shared/      # Shared components
│               ├── guards/
│               └── components/
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/classy-book.git
cd classy-book

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Setup

Create `.env` file in the backend folder:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/classybook

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Admin (seeded on first run)
ADMIN_EMAIL=admin@classybook.com
ADMIN_PASSWORD=12345678
```

### Running the Application

```bash
# Start Backend (development)
cd backend
npm run start:dev

# Start Frontend (in another terminal)
cd frontend
npm run start
```

### Access the Application

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000/api/v1
- **Admin Login:** http://localhost:4200/admin/login

### Default Admin Credentials

| Field    | Value                |
| -------- | -------------------- |
| Email    | admin@classybook.com |
| Password | 12345678             |

## 📊 Admin Dashboard Features

### Security Monitoring (Real-time)

The monitoring dashboard provides real-time security insights:

- ✅ **Login Attempts** - Track all login attempts with success/failure status
- 🚫 **Blocked IPs** - View and manage blocked IP addresses
- 📈 **Security Metrics** - Live statistics of security events
- 🔄 **WebSocket Updates** - Instant updates without page refresh

### Session Management

- ⏱️ **15-minute Session Timer** - Visual countdown in navbar
- 🔔 **Session Expiry Warning** - Alert before automatic logout
- 🔐 **Secure Token Storage** - JWT stored securely

## 🌐 API Endpoints

### Authentication

| Method | Endpoint                   | Description          |
| ------ | -------------------------- | -------------------- |
| POST   | `/api/v1/auth/admin/login` | Admin login          |
| POST   | `/api/v1/auth/login`       | User login           |
| POST   | `/api/v1/auth/register`    | User registration    |
| POST   | `/api/v1/auth/refresh`     | Refresh access token |
| POST   | `/api/v1/auth/logout`      | Logout               |

### Monitoring (Admin Only)

| Method | Endpoint                              | Description               |
| ------ | ------------------------------------- | ------------------------- |
| GET    | `/api/v1/monitoring/security-metrics` | Get security statistics   |
| GET    | `/api/v1/monitoring/login-attempts`   | Get recent login attempts |
| GET    | `/api/v1/monitoring/blocked-ips`      | Get blocked IP list       |
| POST   | `/api/v1/monitoring/unblock-ip`       | Unblock an IP address     |

## 🔌 WebSocket Events

### Monitoring Namespace (`/realtime`)

```typescript
// Join monitoring room (admin only)
socket.emit("join:monitoring");

// Listen for login attempts
socket.on("monitoring:login-attempt", (data) => {
  console.log("New login attempt:", data);
});

// Listen for IP blocked
socket.on("monitoring:ip-blocked", (data) => {
  console.log("IP blocked:", data);
});

// Listen for metrics updates
socket.on("monitoring:security-metrics", (data) => {
  console.log("Metrics updated:", data);
});
```

## 🌍 Internationalization (i18n)

The application supports:

- 🇸🇦 **Arabic (ar)** - RTL support
- 🇺🇸 **English (en)** - LTR default

Language can be switched from the navbar.

## 🎨 Theming

Three theme options available:

- ☀️ **Light Mode**
- 🌙 **Dark Mode**
- 💻 **System Default**

## 🧪 Testing

```bash
# Backend unit tests
cd backend
npm run test

# Backend e2e tests
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

## 📦 Building for Production

```bash
# Build Backend
cd backend
npm run build

# Build Frontend
cd frontend
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<a name="arabic"></a>

## 🌟 نظرة عامة

كلاسي بوك هو نظام إدارة تعلم شامل مبني بتقنيات حديثة وميزات أمان على مستوى المؤسسات.

## 🚀 البدء السريع

### المتطلبات

- Node.js 18.x أو أعلى
- حساب MongoDB Atlas
- npm أو yarn

### التثبيت

```bash
# تثبيت الـ Backend
cd backend
npm install

# تثبيت الـ Frontend
cd frontend
npm install
```

### التشغيل

```bash
# تشغيل الـ Backend
cd backend
npm run start:dev

# تشغيل الـ Frontend (في terminal آخر)
cd frontend
npm run start
```

### الوصول

- **الواجهة:** http://localhost:4200
- **تسجيل دخول الأدمن:** http://localhost:4200/admin/login

### بيانات الأدمن الافتراضية

| الحقل             | القيمة               |
| ----------------- | -------------------- |
| البريد الإلكتروني | admin@classybook.com |
| كلمة المرور       | 12345678             |

## 📊 لوحة تحكم الأدمن

### مراقبة الأمان (في الوقت الفعلي)

- ✅ **محاولات تسجيل الدخول** - تتبع جميع المحاولات
- 🚫 **عناوين IP المحظورة** - عرض وإدارة العناوين المحظورة
- 📈 **إحصائيات الأمان** - بيانات حية
- 🔄 **تحديثات WebSocket** - تحديثات فورية بدون تحديث الصفحة

### إدارة الجلسات

- ⏱️ **مؤقت الجلسة 15 دقيقة** - عداد تنازلي مرئي
- 🔔 **تنبيه انتهاء الجلسة** - تنبيه قبل تسجيل الخروج التلقائي
- 🔐 **تخزين آمن للرموز** - JWT مخزن بشكل آمن

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Made with ❤️ by the Classy Book Team**

</div>

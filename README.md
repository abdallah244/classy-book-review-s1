<div align="center">

# 📚 Classy Book

### Enterprise-Grade Educational Platform

<p>
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&pause=1000&color=6366F1&center=true&vCenter=true&random=false&width=600&height=60&lines=Modern+Learning+Management+System;Built+with+NestJS+%2B+Angular;Enterprise-Ready+Architecture" alt="Typing SVG" />
</p>

[![Status](https://img.shields.io/badge/Status-🚧_In_Development-yellow?style=for-the-badge&labelColor=1e293b)](https://github.com)
[![Version](https://img.shields.io/badge/Version-0.1.0-blue?style=for-the-badge&labelColor=1e293b)](https://github.com)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge&labelColor=1e293b)](https://github.com)

<p>
  <img src="https://img.shields.io/badge/NestJS-11.0-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular">
  <img src="https://img.shields.io/badge/MongoDB-9.0-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Redis-7.0-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Socket.io-4.0-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.io">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
</p>

---

**A comprehensive, scalable, and secure Learning Management System (LMS) built with cutting-edge technologies for delivering high-quality educational content.**

[Features](#-features) • [Architecture](#️-architecture) • [Getting Started](#-getting-started) • [Documentation](#-security-module) • [API Reference](#-api-reference)

</div>

---

## 📋 Table of Contents

<details open>
<summary><strong>Click to expand</strong></summary>

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [🔐 Security Module](#-security-module)
- [⚡ Performance Module](#-performance-module)
- [🗄️ MongoDB Module](#️-mongodb-module)
- [📦 Common Module](#-common-module)
- [☁️ Cloudinary Module](#️-cloudinary-module)
- [🎨 Frontend Module](#-frontend-module)
- [🛠️ Tech Stack](#️-tech-stack)
- [🔧 Environment Variables](#-environment-variables)
- [🚀 Getting Started](#-getting-started)
- [📝 API Reference](#-api-reference)
- [📊 Database Schema](#-database-schema)
- [🧪 Testing](#-testing)
- [📈 Changelog](#-changelog)

</details>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Core Features

- 📹 **Video Courses** - HD streaming with HLS
- 📝 **Interactive Quizzes** - Real-time assessments
- 💬 **Live Chat** - Student-teacher communication
- 📊 **Progress Tracking** - Detailed analytics
- 🎓 **Certificates** - Auto-generated certificates
- 💳 **Payments** - Stripe & Paymob integration

</td>
<td width="50%">

### ⚡ Technical Excellence

- 🚀 **High Performance** - Redis caching
- 🔄 **Real-time** - Socket.io integration
- 📦 **Background Jobs** - Bull queue processing
- ☁️ **Cloud Storage** - Cloudinary CDN
- 🔐 **Enterprise Security** - Multi-layer protection
- 🏢 **Multi-tenancy** - Isolated tenant data

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │   Angular 21    │  │   Mobile App    │  │    Admin Dashboard      │  │
│  │   (Frontend)    │  │   (Future)      │  │    (Angular)            │  │
│  └────────┬────────┘  └────────┬────────┘  └───────────┬─────────────┘  │
└───────────┼────────────────────┼───────────────────────┼────────────────┘
            │                    │                       │
            ▼                    ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ Rate Limit  │  │  JWT Auth    │  │  CORS/Helmet  │  │  Swagger    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  └─────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        NestJS 11 BACKEND                                 │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      SECURITY MODULE                              │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │   │
│  │  │  Auth   │ │ Sessions │ │ Roles & │ │ API Key │ │  Brute    │  │   │
│  │  │  (JWT)  │ │  Mgmt    │ │ Perms   │ │ Guard   │ │  Force    │  │   │
│  │  └─────────┘ └──────────┘ └─────────┘ └─────────┘ └───────────┘  │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │   │
│  │  │  CSRF   │ │  Helmet  │ │Sanitize │ │ Audit   │ │  Webhook  │  │   │
│  │  │ Token   │ │ Headers  │ │ (XSS)   │ │  Log    │ │ Security  │  │   │
│  │  └─────────┘ └──────────┘ └─────────┘ └─────────┘ └───────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     PERFORMANCE MODULE                            │   │
│  │  ┌─────────────┐ ┌───────────┐ ┌────────────┐ ┌────────────────┐ │   │
│  │  │   Circuit   │ │   File    │ │Idempotency │ │  Observability │ │   │
│  │  │   Breaker   │ │  Upload   │ │   Guard    │ │  (Metrics)     │ │   │
│  │  └─────────────┘ └───────────┘ └────────────┘ └────────────────┘ │   │
│  │  ┌─────────────┐ ┌───────────────────────────────────────────┐   │   │
│  │  │   Search    │ │            Real-time (Socket.io)          │   │   │
│  │  │  (MongoDB)  │ │                                           │   │   │
│  │  └─────────────┘ └───────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                       COMMON MODULE                               │   │
│  │  ┌───────────┐ ┌────────────┐ ┌───────────┐ ┌─────────────────┐  │   │
│  │  │   Redis   │ │ Pagination │ │   Queue   │ │    Response     │  │   │
│  │  │   Cache   │ │  Service   │ │   (Bull)  │ │   Optimizer     │  │   │
│  │  └───────────┘ └────────────┘ └───────────┘ └─────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌───────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   MongoDB     │      │     Redis       │      │   Cloudinary    │
│   (Atlas)     │      │   (Cache/Queue) │      │   (CDN/Storage) │
│               │      │                 │      │                 │
│ • Users       │      │ • Sessions      │      │ • Images        │
│ • Courses     │      │ • Cache         │      │ • Videos (HLS)  │
│ • Enrollments │      │ • Rate Limits   │      │ • Documents     │
│ • Payments    │      │ • Job Queues    │      │ • Thumbnails    │
│ • Audit Logs  │      │ • Idempotency   │      │                 │
└───────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 📁 Project Structure

```
📁 classy-book/
├── 📄 README.md                    # Project documentation
├── 📄 Summary.md                   # Development summary
│
├── 📁 backend/                     # NestJS Backend
│   ├── 📄 package.json
│   ├── 📄 nest-cli.json
│   ├── 📄 tsconfig.json
│   └── 📁 src/
│       ├── 📄 main.ts              # Application entry point
│       ├── 📄 app.module.ts        # Root module
│       │
│       ├── 📁 security/            # 🔐 Security Module
│       │   ├── 📁 auth/            # JWT Authentication
│       │   ├── 📁 users/           # User Management
│       │   ├── 📁 sessions/        # Session Management
│       │   ├── 📁 roles-permissions/# RBAC System
│       │   ├── 📁 api-key/         # API Key Management
│       │   ├── 📁 rate-limit/      # Rate Limiting
│       │   ├── 📁 brute-force/     # Brute Force Protection
│       │   ├── 📁 csrf/            # CSRF Protection
│       │   ├── 📁 helmet/          # HTTP Security Headers
│       │   ├── 📁 sanitization/    # XSS Prevention
│       │   ├── 📁 validation/      # Input Validation
│       │   ├── 📁 audit-log/       # Activity Logging
│       │   └── 📁 webhook-security/# Webhook Verification
│       │
│       ├── 📁 performance/         # ⚡ Performance Module
│       │   ├── 📁 circuit-breaker/ # Fault Tolerance
│       │   ├── 📁 file/            # File Processing
│       │   ├── 📁 idempotency/     # Duplicate Prevention
│       │   ├── 📁 observability/   # Logging & Metrics
│       │   ├── 📁 realtime/        # Socket.io Gateway
│       │   └── 📁 search/          # Full-text Search
│       │
│       ├── 📁 mongodb/             # 🗄️ MongoDB Module
│       │   ├── 📁 data-access/     # Repository Pattern
│       │   ├── 📁 indexes/         # Index Management
│       │   ├── 📁 multi-tenancy/   # Tenant Isolation
│       │   └── 📁 soft-delete/     # Soft Delete Plugin
│       │
│       ├── 📁 common/              # 📦 Common Module
│       │   ├── 📁 cache/           # Redis Cache
│       │   ├── 📁 pagination/      # Pagination Service
│       │   ├── 📁 queue/           # Bull Queues
│       │   └── 📁 response/        # Response Optimizer
│       │
│       └── 📁 cloudinary/          # ☁️ Cloud Storage
│
└── 📁 frontend/                    # Angular Frontend
    ├── 📄 package.json
    ├── 📄 angular.json
    ├── 📄 tsconfig.json
    └── 📁 src/
        ├── 📄 main.ts
        ├── 📄 index.html
        └── 📁 app/
            ├── 📄 app.ts
            ├── 📄 app.routes.ts
            └── 📁 core/            # 🎨 Core Module
                ├── 📁 services/    # Application Services
                ├── 📁 guards/      # Route Guards
                ├── 📁 interceptors/# HTTP Interceptors
                ├── 📁 directives/  # Custom Directives
                └── 📁 components/  # Shared Components
```

---

## 🔐 Security Module

A comprehensive, enterprise-grade security system with **13 specialized sub-modules**.

### 1. Authentication (`auth/`)

| Component       | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `AuthService`   | Complete JWT-based authentication with bcrypt password hashing |
| `JwtStrategy`   | Passport JWT strategy for token validation                     |
| `JwtAuthGuard`  | Route protection with `@Public()` decorator support            |
| `LocalStrategy` | Email/password authentication strategy                         |

**Features:**

| Feature             | Description                              |
| ------------------- | ---------------------------------------- |
| ✅ Registration     | Create new user accounts with validation |
| ✅ Login            | Email/password authentication            |
| ✅ JWT Access Token | Short-lived tokens (configurable expiry) |
| ✅ Refresh Tokens   | Secure token rotation mechanism          |
| ✅ Account Locking  | Lock after 5 failed attempts (30 min)    |
| ✅ Logout           | Single device or all devices             |
| ✅ Device Tracking  | Track login devices & fingerprints       |

**API Endpoints:**

```http
POST /api/v1/auth/register    # Create new account
POST /api/v1/auth/login       # Authenticate user
POST /api/v1/auth/refresh     # Refresh access token
POST /api/v1/auth/logout      # Logout current session
POST /api/v1/auth/logout-all  # Logout all sessions
GET  /api/v1/auth/me          # Get current user
```

---

### 2. Users Management (`users/`)

| Feature         | Description                        |
| --------------- | ---------------------------------- |
| CRUD Operations | Create, read, update, delete users |
| Soft Delete     | Delete with restore capability     |
| Pagination      | Cursor & offset pagination         |
| Search          | Full-text search by name/email     |
| Role Management | Assign/remove user roles           |

**API Endpoints:**

```http
GET    /api/v1/users          # List all users (paginated)
GET    /api/v1/users/:id      # Get user by ID
POST   /api/v1/users          # Create new user
PATCH  /api/v1/users/:id      # Update user
DELETE /api/v1/users/:id      # Soft delete user
POST   /api/v1/users/:id/restore  # Restore deleted user
```

---

### 3. Sessions Management (`sessions/`)

Multi-device session management with fingerprinting.

| Feature           | Description                       |
| ----------------- | --------------------------------- |
| ✅ Create Session | Store device info, IP, user agent |
| ✅ List Sessions  | View all active sessions per user |
| ✅ Revoke Session | Terminate specific session        |
| ✅ Revoke All     | Terminate all user sessions       |
| ✅ Validation     | Verify session is still valid     |
| ✅ TTL Expiry     | Auto-expire after 30 days         |

---

### 4. Roles & Permissions (`roles-permissions/`)

Complete Role-Based Access Control (RBAC) system.

**Default Roles:**

| Role          | Level | Permissions                  |
| ------------- | ----- | ---------------------------- |
| `super_admin` | 100   | `*` (full access)            |
| `admin`       | 80    | User & content management    |
| `teacher`     | 50    | Course creation & management |
| `student`     | 10    | Course access & profile      |

**Decorators:**

```typescript
// Restrict by role
@Roles('admin', 'teacher')
@UseGuards(RolesGuard)
createCourse() {}

// Restrict by permission
@RequirePermissions('courses:create', 'courses:update')
@UseGuards(PermissionsGuard)
updateCourse() {}
```

---

### 5. API Key Management (`api-key/`)

Secure API key system for external integrations.

| Feature             | Description                   |
| ------------------- | ----------------------------- |
| ✅ Key Generation   | Secure keys with `cb_` prefix |
| ✅ Hashed Storage   | SHA-256 hashed keys           |
| ✅ IP Whitelist     | Restrict by IP address        |
| ✅ Domain Whitelist | Restrict by domain            |
| ✅ Rate Limiting    | Per-key rate limits           |
| ✅ Expiration       | Time-limited keys             |
| ✅ Usage Tracking   | Track usage count & last used |

---

### 6. Rate Limiting (`rate-limit/`)

Redis-backed distributed rate limiting.

```typescript
// Global rate limit
ThrottlerModule.forRoot({
  throttlers: [{ limit: 100, ttl: 60000 }] // 100 req/min
})

// Route-specific limits
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 req/min
@Post('login')
login() {}
```

---

### 7. Brute Force Protection (`brute-force/`)

Intelligent login attempt tracking.

| Config           | Value      |
| ---------------- | ---------- |
| Max Attempts     | 5          |
| Lockout Duration | 15 minutes |
| Window           | 60 minutes |

---

### 8. CSRF Protection (`csrf/`)

Cross-Site Request Forgery protection.

```typescript
// Cookie: XSRF-TOKEN
// Header: X-XSRF-TOKEN
```

---

### 9. Helmet Security (`helmet/`)

HTTP security headers configuration.

| Header                    | Value                           |
| ------------------------- | ------------------------------- |
| Content-Security-Policy   | Strict CSP                      |
| X-Frame-Options           | DENY                            |
| X-Content-Type-Options    | nosniff                         |
| X-XSS-Protection          | 1; mode=block                   |
| Strict-Transport-Security | max-age=31536000                |
| Referrer-Policy           | strict-origin-when-cross-origin |

---

### 10. Sanitization (`sanitization/`)

XSS and NoSQL injection prevention.

| Function               | Description                              |
| ---------------------- | ---------------------------------------- |
| `sanitizeHtml()`       | Strip all HTML tags                      |
| `sanitizeRichText()`   | Allow safe tags (p, b, i, ul, ol, li, a) |
| `sanitizeMongoQuery()` | Remove `$` operators                     |
| `sanitizeObject()`     | Deep sanitize objects                    |
| `escapeXss()`          | Escape XSS characters                    |

---

### 11. Validation (`validation/`)

Global validation with class-validator.

- ✅ Whitelist mode - strip unknown properties
- ✅ Transform types automatically
- ✅ Custom error formatting
- ✅ Show all validation errors

---

### 12. Audit Log (`audit-log/`)

Comprehensive activity logging.

| Field       | Description                         |
| ----------- | ----------------------------------- |
| `action`    | create, update, delete, login, etc. |
| `resource`  | user, course, payment, etc.         |
| `userId`    | Who performed the action            |
| `oldData`   | Previous state (for updates)        |
| `newData`   | New state                           |
| `ip`        | Client IP address                   |
| `userAgent` | Browser/device info                 |
| `duration`  | Response time in ms                 |
| `success`   | Success/failure status              |

**Decorator:**

```typescript
@AuditLog({ action: 'create', resource: 'course' })
@Post()
createCourse() {}
```

---

### 13. Webhook Security (`webhook-security/`)

Secure webhook verification.

| Provider | Algorithm   |
| -------- | ----------- |
| Stripe   | HMAC-SHA256 |
| Paymob   | HMAC-SHA512 |
| Generic  | HMAC-SHA256 |

---

## ⚡ Performance Module

Optimized for high-traffic, low-latency operations.

### 1. Circuit Breaker (`circuit-breaker/`)

Fault tolerance pattern for external services.

```
┌─────────────┐     failure      ┌─────────────┐
│   CLOSED    │ ───────────────► │    OPEN     │
│ (Normal)    │ (5 failures)     │ (Blocking)  │
└──────┬──────┘                  └──────┬──────┘
       │                                │
       │ success                        │ timeout (30s)
       │                                ▼
       │                         ┌─────────────┐
       └──────────────────────── │  HALF_OPEN  │
                  (3 successes)  │  (Testing)  │
                                 └─────────────┘
```

| Config            | Default    |
| ----------------- | ---------- |
| Failure Threshold | 5          |
| Success Threshold | 3          |
| Timeout           | 30 seconds |

---

### 2. File Service (`file/`)

Optimized file upload and processing.

| File Type | Max Size | Processing                        |
| --------- | -------- | --------------------------------- |
| Images    | 5 MB     | Resize, compress, WebP conversion |
| Videos    | 500 MB   | HLS streaming, 720p backup        |
| Documents | 20 MB    | PDF/Office support                |

**Features:**

- ✅ Sharp image optimization
- ✅ Automatic thumbnail generation (300x300)
- ✅ HLS video streaming
- ✅ Format validation
- ✅ Cloudinary CDN integration

---

### 3. Idempotency (`idempotency/`)

Duplicate request prevention.

```typescript
@Idempotent()
@Post('payment')
processPayment() {}

// Header: Idempotency-Key: <unique-key>
```

| Config  | Value                  |
| ------- | ---------------------- |
| TTL     | 24 hours               |
| Storage | Redis                  |
| Status  | processing → completed |

---

### 4. Search Service (`search/`)

Advanced MongoDB text search.

| Feature          | Description                      |
| ---------------- | -------------------------------- |
| Full-text Search | Text indexes with Arabic support |
| Regex Search     | Partial matching                 |
| Range Filters    | Price, date ranges               |
| Faceted Search   | Category, rating filters         |
| Score Ranking    | Relevance-based sorting          |

---

### 5. Real-time (`realtime/`)

Socket.io WebSocket gateway.

**Events:**

| Event           | Description          |
| --------------- | -------------------- |
| `join-room`     | Join a specific room |
| `leave-room`    | Leave a room         |
| `send-message`  | Send message to room |
| `typing`        | Typing indicator     |
| `online-status` | User presence        |

**Rooms:**

- `user:${userId}` - Private user room
- `role:${role}` - Role-based room
- `course:${courseId}` - Course room
- `lesson:${lessonId}` - Lesson room
- `tenant:${tenantId}` - Tenant room

---

### 6. Observability (`observability/`)

Logging, metrics, and health checks.

**Logger:**

```typescript
this.logger.info("User created", { userId, email });
this.logger.error("Payment failed", { error, transactionId });
```

**Metrics:**

| Type      | Example                  |
| --------- | ------------------------ |
| Counter   | http_requests_total      |
| Gauge     | active_connections       |
| Histogram | request_duration_seconds |

**Health Endpoints:**

```http
GET /health       # Full health check
GET /health/ready # Readiness probe
GET /health/live  # Liveness probe
GET /metrics      # Prometheus metrics
```

---

## 🗄️ MongoDB Module

Enterprise MongoDB patterns and utilities.

### 1. Data Access (`data-access/`)

Generic repository pattern with query builder.

**BaseRepository Methods:**

```typescript
// Create
create(data)
createMany(data[])

// Read
findById(id)
findOne(filter)
findAll(filter, options)
findWithPagination(filter, options)

// Update
updateById(id, data)
updateOne(filter, data)
updateMany(filter, data)

// Delete
deleteById(id)
deleteOne(filter)
deleteMany(filter)

// Aggregations
count(filter)
exists(filter)
aggregate(pipeline)
```

**TransactionService:**

```typescript
// Sequential operations
await transactionService.executeSequential([
  () => userRepo.create(userData),
  () => walletRepo.create(walletData),
]);

// Parallel operations
await transactionService.executeParallel([
  () => notificationService.send(),
  () => emailService.send(),
]);
```

---

### 2. Index Management (`indexes/`)

Pre-configured indexes for optimal performance.

| Collection    | Indexes                                           |
| ------------- | ------------------------------------------------- |
| users         | email (unique), role, text search                 |
| courses       | slug (unique), category, price range, text search |
| lessons       | course + order, section + order                   |
| enrollments   | user + course (unique), expiry TTL                |
| audit_logs    | createdAt (TTL: 365 days)                         |
| notifications | createdAt (TTL: 90 days)                          |

---

### 3. Multi-Tenancy (`multi-tenancy/`)

Complete tenant isolation.

**Tenant Resolution (Priority):**

1. `X-Tenant-Id` header
2. Subdomain (tenant.classybook.com)
3. Query parameter (development only)
4. JWT token claim

---

### 4. Soft Delete (`soft-delete/`)

Non-destructive deletion with restore.

```typescript
// Soft delete
await softDeleteService.softDelete(model, id, userId);

// Restore
await softDeleteService.restore(model, id);

// Query deleted only
await softDeleteService.findDeleted(model);

// Permanent cleanup (after 90 days)
await softDeleteService.permanentlyDelete(model, 90);
```

---

## 📦 Common Module

Shared utilities and services.

### 1. Redis Cache (`cache/`)

High-performance caching layer.

```typescript
// Simple operations
await cache.set("key", value, ttl);
await cache.get("key");
await cache.delete("key");

// Cache-aside pattern
const data = await cache.getOrSet(
  "key",
  async () => {
    return await expensiveOperation();
  },
  3600,
);
```

---

### 2. Pagination (`pagination/`)

Flexible pagination service.

```typescript
// Offset pagination
const result = await paginationService.paginate(Model, {
  page: 1,
  limit: 20,
  filter: { status: "active" },
});

// Cursor pagination
const result = await paginationService.cursorPaginate(Model, {
  cursor: "lastId",
  limit: 20,
});
```

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 3. Queue (`queue/`)

Background job processing with Bull.

| Queue              | Purpose                        |
| ------------------ | ------------------------------ |
| `image-processing` | Image optimization, thumbnails |
| `video-processing` | Video transcoding, HLS         |
| `email`            | Email sending                  |
| `notifications`    | Push notifications             |

**Configuration:**

- Retry: 3 attempts with exponential backoff
- Auto cleanup on completion
- Redis-backed persistence

---

### 4. Response Optimizer (`response/`)

Standardized API responses.

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

**Features:**

- Remove sensitive fields (password, \_\_v)
- Convert `_id` to `id`
- Add performance headers (X-Response-Time, X-Request-Id)

---

## ☁️ Cloudinary Module

Cloud storage and CDN integration.

| Feature         | Description                       |
| --------------- | --------------------------------- |
| Image Upload    | Auto quality, format optimization |
| Video Upload    | HLS streaming profiles            |
| Document Upload | PDF, Office files                 |
| Transformations | Resize, crop, effects             |
| CDN Delivery    | Global edge network               |

---

## 🎨 Frontend Module

Angular 21 with standalone components.

### Core Services

| Service              | Description                           |
| -------------------- | ------------------------------------- |
| `ApiClientService`   | HTTP client with retry, loading state |
| `AuthService`        | JWT auth with signal-based state      |
| `StateStoreService`  | Signal-based state management         |
| `RealtimeService`    | Socket.io client                      |
| `I18nService`        | i18n (Arabic/English) with RTL        |
| `ThemeService`       | Dark/Light/System themes              |
| `OfflineService`     | Offline support with IndexedDB        |
| `PerformanceService` | Performance monitoring                |
| `CachingService`     | Client-side caching                   |
| `ToastService`       | Toast notifications                   |
| `ModalService`       | Modal dialogs                         |

### Guards

| Guard             | Description                  |
| ----------------- | ---------------------------- |
| `authGuard`       | Protect authenticated routes |
| `guestGuard`      | Protect public-only routes   |
| `roleGuard`       | Role-based protection        |
| `permissionGuard` | Permission-based protection  |

### Directives

| Directive         | Usage                               |
| ----------------- | ----------------------------------- |
| `*hasPermission`  | `*hasPermission="'courses:create'"` |
| `*hasRole`        | `*hasRole="'admin'"`                |
| `virtualScroll`   | Large list virtualization           |
| `scrollAnimation` | Scroll-triggered animations         |

---

## 🛠️ Tech Stack

| Category               | Technology            | Version   |
| ---------------------- | --------------------- | --------- |
| **Backend Framework**  | NestJS                | 11.0      |
| **Frontend Framework** | Angular               | 21.0      |
| **Language**           | TypeScript            | 5.7 / 5.9 |
| **Database**           | MongoDB (Mongoose)    | 9.0       |
| **Cache & Queue**      | Redis (ioredis)       | 7.0       |
| **Real-time**          | Socket.io             | 4.0       |
| **Authentication**     | Passport + JWT        | -         |
| **File Storage**       | Cloudinary            | -         |
| **Image Processing**   | Sharp                 | -         |
| **Queue Processing**   | Bull                  | -         |
| **API Documentation**  | Swagger               | -         |
| **Validation**         | class-validator       | -         |
| **Security**           | Helmet, sanitize-html | -         |

---

## 🔧 Environment Variables

Create `.env` file in `backend/`:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/classybook

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# CORS
CORS_ORIGIN=http://localhost:4200

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Paymob (Payments)
PAYMOB_API_KEY=xxx
PAYMOB_WEBHOOK_SECRET=xxx
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- MongoDB 7+
- Redis 7+

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/classy-book.git
cd classy-book

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Build for Production

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
```

---

## 📝 API Reference

### Authentication

| Method | Endpoint                | Description       |
| ------ | ----------------------- | ----------------- |
| POST   | `/api/v1/auth/register` | Register new user |
| POST   | `/api/v1/auth/login`    | Login user        |
| POST   | `/api/v1/auth/refresh`  | Refresh token     |
| POST   | `/api/v1/auth/logout`   | Logout            |
| GET    | `/api/v1/auth/me`       | Get current user  |

### Users

| Method | Endpoint            | Description |
| ------ | ------------------- | ----------- |
| GET    | `/api/v1/users`     | List users  |
| GET    | `/api/v1/users/:id` | Get user    |
| POST   | `/api/v1/users`     | Create user |
| PATCH  | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Delete user |

### Health

| Method | Endpoint        | Description        |
| ------ | --------------- | ------------------ |
| GET    | `/health`       | Health check       |
| GET    | `/health/ready` | Readiness probe    |
| GET    | `/health/live`  | Liveness probe     |
| GET    | `/metrics`      | Prometheus metrics |

---

## 📊 Database Schema

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string,           // unique, indexed
  password: string,        // bcrypt hashed
  name: string,
  phone?: string,
  avatar?: string,
  role: 'student' | 'teacher' | 'admin' | 'super_admin',
  permissions: string[],
  isEmailVerified: boolean,
  isActive: boolean,
  isLocked: boolean,
  lockUntil?: Date,
  failedLoginAttempts: number,
  lastLogin?: Date,
  passwordChangedAt?: Date,
  isDeleted: boolean,
  deletedAt?: Date,
  deletedBy?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Sessions Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId,        // indexed
  refreshToken: string,    // hashed
  deviceInfo: {
    userAgent: string,
    ip: string,
    fingerprint?: string
  },
  isRevoked: boolean,
  lastActivity: Date,
  expiresAt: Date,         // TTL index
  createdAt: Date
}
```

### Audit Logs Collection

```typescript
{
  _id: ObjectId,
  action: string,          // indexed
  resource: string,        // indexed
  resourceId?: ObjectId,
  userId?: ObjectId,       // indexed
  oldData?: object,
  newData?: object,
  ip?: string,
  userAgent?: string,
  duration?: number,
  success: boolean,
  errorMessage?: string,
  metadata?: object,
  tenantId?: ObjectId,
  createdAt: Date          // TTL: 365 days
}
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📈 Changelog

### v0.1.0 (January 2026)

#### ✅ Completed

**Backend - Security Module**

- [x] JWT Authentication with refresh tokens
- [x] User management with soft delete
- [x] Session management (multi-device)
- [x] Role-based access control (RBAC)
- [x] API key management
- [x] Rate limiting (Redis-backed)
- [x] Brute force protection
- [x] CSRF protection
- [x] Helmet security headers
- [x] Input sanitization (XSS/NoSQL)
- [x] Validation module
- [x] Audit logging
- [x] Webhook security

**Backend - Performance Module**

- [x] Circuit breaker pattern
- [x] File upload & optimization
- [x] Idempotency handling
- [x] Observability (logs, metrics, health)
- [x] Real-time (Socket.io)
- [x] Full-text search

**Backend - MongoDB Module**

- [x] Repository pattern
- [x] Query builder
- [x] Transaction service
- [x] Index management
- [x] Multi-tenancy
- [x] Soft delete plugin

**Backend - Common Module**

- [x] Redis cache
- [x] Pagination service
- [x] Queue processing (Bull)
- [x] Response optimizer

**Frontend - Core Module**

- [x] API client service
- [x] Auth service (signals)
- [x] State management
- [x] Route guards
- [x] HTTP interceptors
- [x] Custom directives
- [x] Theme service
- [x] i18n service

---

<div align="center">

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

This project is private and proprietary.

---

**Built with by the Classy Book Team**

<p>
  <img src="https://img.shields.io/badge/Made_with-NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/Made_with-Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular">
  <img src="https://img.shields.io/badge/Made_with-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

</div>

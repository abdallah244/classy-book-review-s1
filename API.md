# 📖 API Documentation

<div align="center">

**Complete API Reference for Classy Book**

[![API Version](https://img.shields.io/badge/API-v1-blue.svg)]()
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-green.svg)]()

**Base URL:** `http://localhost:3000/api/v1`

</div>

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Admin Authentication](#admin-authentication)
- [Monitoring](#monitoring)
- [Users](#users)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Login ──► Access Token (15min) ──► Refresh ──► New Token │
│                     │                                       │
│                     ▼                                       │
│              API Requests                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Admin Authentication

### Login

Authenticate as an administrator.

```http
POST /auth/admin/login
```

#### Request Body

```json
{
  "email": "admin@classybook.com",
  "password": "12345678",
  "rememberMe": false
}
```

| Field        | Type    | Required | Description                  |
| ------------ | ------- | -------- | ---------------------------- |
| `email`      | string  | ✅       | Admin email address          |
| `password`   | string  | ✅       | Admin password (min 8 chars) |
| `rememberMe` | boolean | ❌       | Extend session duration      |

#### Success Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@classybook.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "super_admin",
      "isPrimaryAdmin": true
    }
  }
}
```

#### Error Responses

| Status | Code                  | Description              |
| ------ | --------------------- | ------------------------ |
| 401    | `INVALID_CREDENTIALS` | Wrong email or password  |
| 403    | `ACCOUNT_LOCKED`      | Too many failed attempts |
| 403    | `IP_BLOCKED`          | IP address is blocked    |
| 429    | `TOO_MANY_REQUESTS`   | Rate limit exceeded      |

---

### User Login

Authenticate as a regular user.

```http
POST /auth/login
```

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  }
}
```

---

### Refresh Token

Get a new access token using refresh token.

```http
POST /auth/refresh
```

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Success Response

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

---

### Logout

Invalidate current session.

```http
POST /auth/logout
```

#### Headers

```http
Authorization: Bearer <access_token>
```

#### Success Response

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📊 Monitoring

> ⚠️ **Admin Only** - These endpoints require admin authentication

### Get Security Metrics

Retrieve security statistics.

```http
GET /monitoring/security-metrics
```

#### Headers

```http
Authorization: Bearer <admin_access_token>
```

#### Success Response

```json
{
  "success": true,
  "data": {
    "successfulLogins": 150,
    "failedLogins": 23,
    "blockedIPs": 5,
    "activeSessions": 12
  }
}
```

---

### Get Login Attempts

Retrieve recent login attempts.

```http
GET /monitoring/login-attempts
```

#### Query Parameters

| Parameter | Type    | Default | Description              |
| --------- | ------- | ------- | ------------------------ |
| `page`    | number  | 1       | Page number              |
| `limit`   | number  | 50      | Items per page           |
| `success` | boolean | -       | Filter by success status |

#### Success Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "admin@classybook.com",
      "ipAddress": "192.168.1.1",
      "success": true,
      "timestamp": "2026-01-31T14:30:00.000Z",
      "deviceInfo": "Chrome 120, Windows 10",
      "sessionId": "sess_abc123"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "email": "hacker@example.com",
      "ipAddress": "10.0.0.50",
      "success": false,
      "timestamp": "2026-01-31T14:25:00.000Z",
      "failureReason": "Invalid credentials"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 173,
    "totalPages": 4
  }
}
```

---

### Get Blocked IPs

Retrieve list of blocked IP addresses.

```http
GET /monitoring/blocked-ips
```

#### Success Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "ipAddress": "10.0.0.50",
      "attempts": 10,
      "reason": "Too many failed login attempts",
      "blockedUntil": "2026-02-01T14:30:00.000Z",
      "permanent": false
    }
  ]
}
```

---

### Unblock IP

Remove an IP from the blocklist.

```http
POST /monitoring/unblock-ip
```

#### Request Body

```json
{
  "ipAddress": "10.0.0.50"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "IP 10.0.0.50 has been unblocked"
}
```

---

## 👥 Users

### Register User

Create a new user account.

```http
POST /auth/register
```

#### Request Body

```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

| Field       | Type   | Required | Validation                         |
| ----------- | ------ | -------- | ---------------------------------- |
| `email`     | string | ✅       | Valid email format                 |
| `password`  | string | ✅       | Min 8 chars, 1 uppercase, 1 number |
| `firstName` | string | ✅       | 2-50 characters                    |
| `lastName`  | string | ✅       | 2-50 characters                    |

#### Success Response

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": "507f1f77bcf86cd799439014",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2026-01-31T15:00:00.000Z"
  }
}
```

---

## ❌ Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "statusCode": 400,
  "timestamp": "2026-01-31T15:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

### Common Error Codes

| Code                  | Status | Description                |
| --------------------- | ------ | -------------------------- |
| `VALIDATION_ERROR`    | 400    | Invalid request data       |
| `UNAUTHORIZED`        | 401    | Not authenticated          |
| `INVALID_CREDENTIALS` | 401    | Wrong email/password       |
| `FORBIDDEN`           | 403    | No permission              |
| `ACCOUNT_LOCKED`      | 403    | Account temporarily locked |
| `IP_BLOCKED`          | 403    | IP address blocked         |
| `NOT_FOUND`           | 404    | Resource not found         |
| `TOO_MANY_REQUESTS`   | 429    | Rate limit exceeded        |
| `INTERNAL_ERROR`      | 500    | Server error               |

### Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["email must be a valid email address"],
      "password": ["password must be at least 8 characters"]
    }
  },
  "statusCode": 400
}
```

---

## 🚦 Rate Limiting

API requests are rate-limited to prevent abuse.

### Limits

| Endpoint Type         | Limit        | Window   |
| --------------------- | ------------ | -------- |
| Authentication        | 5 requests   | 1 minute |
| API (authenticated)   | 100 requests | 1 minute |
| API (unauthenticated) | 20 requests  | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706714460
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfter": 45
  },
  "statusCode": 429
}
```

---

## 🔌 WebSocket API

### Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000/realtime", {
  auth: {
    token: "your-access-token",
  },
});
```

### Events

#### Client → Server

| Event              | Payload | Description                  |
| ------------------ | ------- | ---------------------------- |
| `join:monitoring`  | -       | Join monitoring room (admin) |
| `leave:monitoring` | -       | Leave monitoring room        |

#### Server → Client

| Event                         | Payload      | Description       |
| ----------------------------- | ------------ | ----------------- |
| `monitoring:login-attempt`    | LoginAttempt | New login attempt |
| `monitoring:ip-blocked`       | BlockedIP    | IP was blocked    |
| `monitoring:ip-unblocked`     | UnblockedIP  | IP was unblocked  |
| `monitoring:security-metrics` | Metrics      | Updated metrics   |

### Example

```javascript
// Join monitoring room
socket.emit("join:monitoring");

// Listen for login attempts
socket.on("monitoring:login-attempt", (data) => {
  console.log("New login:", data);
  // {
  //   email: "user@example.com",
  //   ipAddress: "192.168.1.1",
  //   success: true,
  //   timestamp: "2026-01-31T15:00:00.000Z"
  // }
});

// Listen for blocked IPs
socket.on("monitoring:ip-blocked", (data) => {
  console.log("IP blocked:", data);
});
```

---

## 📝 TypeScript Types

```typescript
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin" | "super_admin";
  isPrimaryAdmin?: boolean;
}

interface SecurityMetrics {
  successfulLogins: number;
  failedLogins: number;
  blockedIPs: number;
  activeSessions: number;
}

interface LoginAttempt {
  _id: string;
  email: string;
  ipAddress: string;
  success: boolean;
  timestamp: Date;
  deviceInfo?: string;
  failureReason?: string;
  sessionId?: string;
}

interface BlockedIP {
  _id: string;
  ipAddress: string;
  attempts: number;
  reason: string;
  blockedUntil: Date;
  permanent: boolean;
}
```

---

<div align="center">

**Happy Coding! 🚀**

</div>

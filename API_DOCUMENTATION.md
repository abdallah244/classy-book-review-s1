# 🔧 API Documentation - الدليل الكامل للـ Endpoints

## 📑 الفهرس:

- [Monitoring API](#monitoring-api)
- [Admin Management API](#admin-management-api)
- [Authentication Security](#authentication-security)
- [Response Types](#response-types)
- [Error Handling](#error-handling)

---

## 🔍 Monitoring API

### 1. الحصول على محاولات الدخول

```
GET /api/v1/monitoring/login-attempts
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**

```
?limit=10&skip=0      # Pagination (اختياري)
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "success": true,
      "failureReason": null,
      "sessionId": "sess_1234567890ab",
      "deviceFingerprint": "fp_xyz123",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    ...
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "skip": 0,
    "hasMore": true
  }
}
```

---

### 2. الحصول على الـ IPs المحظورة

```
GET /api/v1/monitoring/blocked-ips
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "ipAddress": "192.168.1.100",
      "failedAttempts": 5,
      "lastAttemptAt": "2024-01-15T10:05:00Z",
      "blockedAt": "2024-01-15T10:06:00Z",
      "blockDuration": "15 minutes"
    },
    ...
  ],
  "total": 3,
  "activeBlocks": 3
}
```

---

### 3. الحصول على مقاييس الأمان

```
GET /api/v1/monitoring/security-metrics
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalAttempts": 1250,
    "successfulAttempts": 1150,
    "failedAttempts": 100,
    "blockedIPs": 5,
    "successRate": 92,
    "failureRate": 8,
    "blockRate": 0.4,
    "lastUpdated": "2024-01-15T10:00:00Z"
  }
}
```

---

### 4. الحصول على خط زمني للمحاولات

```
GET /api/v1/monitoring/timeline
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**

```
?hours=24    # آخر 24 ساعة (اختياري، افتراضي: 24)
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "hour": "2024-01-15T00:00:00Z",
      "successful": 45,
      "failed": 5,
      "blocked": 1
    },
    {
      "hour": "2024-01-15T01:00:00Z",
      "successful": 52,
      "failed": 8,
      "blocked": 2
    },
    ...
  ]
}
```

---

### 5. إحصائيات الـ IPs

```
GET /api/v1/monitoring/ip-statistics
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**

```
?limit=10    # أعلى 10 IPs (اختياري)
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "ipAddress": "192.168.1.50",
      "attemptCount": 25,
      "successCount": 20,
      "failureCount": 5,
      "lastAttempt": "2024-01-15T10:15:00Z"
    },
    ...
  ],
  "total": 10
}
```

---

### 6. فك حظر IP

```
POST /api/v1/monitoring/unblock-ip
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**

```json
{
  "ipAddress": "192.168.1.100"
}
```

**Response:**

```json
{
  "success": true,
  "message": "IP unblocked successfully",
  "data": {
    "ipAddress": "192.168.1.100",
    "unblockedAt": "2024-01-15T10:30:00Z",
    "unblockedBy": "admin@example.com"
  }
}
```

---

### 7. حذف محاولات قديمة

```
POST /api/v1/monitoring/cleanup
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Query Parameters:**

```
?daysOld=90    # حذف المحاولات الأقدم من 90 يوم
```

**Response:**

```json
{
  "success": true,
  "message": "Cleanup completed",
  "data": {
    "deletedRecords": 450,
    "remainingRecords": 800,
    "deletedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 👑 Admin Management API

### 1. الحصول على جميع المستخدمين

```
GET /api/v1/admin/users
Authorization: Bearer <ADMIN_JWT>
```

**Query Parameters:**

```
?limit=20&skip=0    # Pagination
?search=email       # Search بـ email (اختياري)
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user1@example.com",
      "name": "Ahmed",
      "role": "user",
      "isLocked": false,
      "lockReason": null,
      "lockedBy": null,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    ...
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "skip": 0,
    "hasMore": true
  }
}
```

---

### 2. الحصول على المستخدمين المقفولين

```
GET /api/v1/admin/locked-users
Authorization: Bearer <ADMIN_JWT>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "suspicious@example.com",
      "lockReason": "Brute Force Attack",
      "lockedBy": "admin@example.com",
      "lockUntil": "2024-01-16T10:00:00Z",
      "lockedAt": "2024-01-15T10:00:00Z"
    },
    ...
  ],
  "total": 3
}
```

---

### 3. الحصول على الـ IPs المحظورة

```
GET /api/v1/admin/blacklisted-ips
Authorization: Bearer <ADMIN_JWT>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ipAddress": "192.168.1.100",
      "reason": "Multiple Failed Login Attempts",
      "isPermanent": false,
      "blockedUntil": "2024-01-15T10:15:00Z",
      "blockedBy": "admin@example.com",
      "blockedAt": "2024-01-15T10:00:00Z",
      "isActive": true
    },
    ...
  ],
  "total": 5
}
```

---

### 4. الحصول على سجل الأنشطة

```
GET /api/v1/admin/activity-log
Authorization: Bearer <ADMIN_JWT>
```

**Query Parameters:**

```
?limit=50&skip=0    # Pagination
?type=lock          # filter by: lock, unlock, blacklist, remove
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "action": "LOCK_USER",
      "targetUser": "user@example.com",
      "performedBy": "admin@example.com",
      "details": {
        "reason": "Suspicious Activity",
        "duration": "24 hours"
      },
      "timestamp": "2024-01-15T10:00:00Z"
    },
    ...
  ],
  "total": 150
}
```

---

### 5. قفل حساب مستخدم

```
POST /api/v1/admin/lock-user
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json
```

**Body:**

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "reason": "Suspicious Activity Detected",
  "duration": 86400000
}
```

**Parameters:**

- `userId`: معرّف المستخدم (ObjectId)
- `reason`: سبب القفل (string)
- `duration`: مدة القفل بالملي ثانية (number)
  - `0` = قفل دائم
  - `3600000` = ساعة واحدة
  - `86400000` = 24 ساعة

**Response:**

```json
{
  "success": true,
  "message": "User locked successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "lockedBy": "admin@example.com",
    "lockReason": "Suspicious Activity Detected",
    "lockUntil": "2024-01-16T10:00:00Z",
    "lockedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 6. فتح حساب مستخدم

```
POST /api/v1/admin/unlock-user
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json
```

**Body:**

```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User unlocked successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "unlockedBy": "admin@example.com",
    "unlockedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 7. إضافة IP إلى القائمة السوداء

```
POST /api/v1/admin/blacklist-ip
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json
```

**Body:**

```json
{
  "ipAddress": "192.168.1.100",
  "reason": "Brute Force Attack",
  "isPermanent": false,
  "duration": 900000
}
```

**Parameters:**

- `ipAddress`: عنوان IP (string)
- `reason`: سبب الحظر (string)
- `isPermanent`: حظر دائم (boolean)
- `duration`: مدة الحظر بالملي ثانية (number) - تجاهل إذا كان isPermanent=true

**Response:**

```json
{
  "success": true,
  "message": "IP blacklisted successfully",
  "data": {
    "ipAddress": "192.168.1.100",
    "reason": "Brute Force Attack",
    "isPermanent": false,
    "blockedUntil": "2024-01-15T10:15:00Z",
    "blockedBy": "admin@example.com",
    "blockedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 8. إزالة IP من القائمة السوداء

```
POST /api/v1/admin/remove-blacklist
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json
```

**Body:**

```json
{
  "ipAddress": "192.168.1.100"
}
```

**Response:**

```json
{
  "success": true,
  "message": "IP removed from blacklist",
  "data": {
    "ipAddress": "192.168.1.100",
    "removedBy": "admin@example.com",
    "removedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔐 Authentication Security

### Headers Required:

```
Authorization: Bearer <JWT_TOKEN>
X-Requested-With: XMLHttpRequest
X-Client-Security-Token: <UNIQUE_TOKEN>
```

### Token Types:

| Type                    | Duration   | Usage                |
| ----------------------- | ---------- | -------------------- |
| **Access Token**        | 7 days     | API endpoints        |
| **Refresh Token**       | 30 days    | Refresh access token |
| **Master Code Session** | 30 minutes | Sensitive pages      |

---

## 📊 Response Types

### Success Response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* endpoint-specific data */
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Error Response:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {
      /* error details */
    }
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## ⚠️ Error Handling

### Common Status Codes:

| Code    | Meaning           | Example              |
| ------- | ----------------- | -------------------- |
| **200** | Success           | Login successful     |
| **400** | Bad Request       | Invalid email format |
| **401** | Unauthorized      | Invalid JWT token    |
| **403** | Forbidden         | IP is blacklisted    |
| **404** | Not Found         | User not found       |
| **429** | Too Many Requests | Rate limit exceeded  |
| **500** | Server Error      | Database error       |

### Example Error Response:

```json
{
  "success": false,
  "message": "IP is blacklisted",
  "error": {
    "code": "IP_BLACKLISTED",
    "details": {
      "ipAddress": "192.168.1.100",
      "reason": "Brute Force Attack",
      "blockedUntil": "2024-01-15T10:15:00Z"
    }
  },
  "statusCode": 403
}
```

---

## 🧪 Testing Examples

### cURL:

```bash
# Get login attempts
curl -X GET http://localhost:3000/api/v1/monitoring/login-attempts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Lock a user
curl -X POST http://localhost:3000/api/v1/admin/lock-user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "reason": "Suspicious Activity",
    "duration": 86400000
  }'

# Blacklist an IP
curl -X POST http://localhost:3000/api/v1/admin/blacklist-ip \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "192.168.1.100",
    "reason": "Brute Force",
    "isPermanent": false,
    "duration": 900000
  }'
```

### JavaScript/Fetch:

```javascript
// Get security metrics
const response = await fetch(
  "http://localhost:3000/api/v1/monitoring/security-metrics",
  {
    method: "GET",
    headers: {
      Authorization: "Bearer YOUR_JWT_TOKEN",
      "X-Requested-With": "XMLHttpRequest",
    },
  },
);

const data = await response.json();
console.log(data);
```

---

## 📋 Rate Limiting:

```
- Normal endpoints: 100 requests per minute
- Auth endpoints: 5 requests per minute
- Admin endpoints: 50 requests per minute
```

---

**آخر تحديث:** 2024
**API Version:** v1
**Status:** Production Ready ✅

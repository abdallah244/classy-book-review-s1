# 🚀 دليل التشغيل والاختبار

## 📋 المتطلبات:

```
✅ Node.js: v20.x+
✅ MongoDB: 7.0+ (Atlas أو Local)
✅ Redis: 7.0+ (اختياري، للـ caching)
✅ npm: v10.x+
✅ PowerShell أو Terminal
```

---

## 🔧 خطوات التثبيت والتشغيل:

### 1️⃣ التثبيت الأولي:

```powershell
# الذهاب إلى مجلد المشروع
cd "c:\Users\hp\OneDrive\سطح المكتب\classy book"

# تثبيت dependencies للـ Backend
cd backend
npm install

# تثبيت dependencies للـ Frontend
cd ../frontend
npm install

# العودة إلى المجلد الرئيسي
cd ..
```

---

### 2️⃣ تكوين المتغيرات البيئية:

#### Backend (.env):

```bash
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/classybook
MONGODB_DB_NAME=classybook

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# Redis (اختياري)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=3000
NODE_ENV=development
```

#### Frontend (environment.ts):

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api/v1",
  apiKey: "your_api_key_here",
};
```

---

### 3️⃣ تشغيل المشروع:

#### طريقة 1: كل في Terminal منفصل

```powershell
# Terminal 1: Backend
cd "c:\Users\hp\OneDrive\سطح المكتب\classy book\backend"
npm run start:dev

# Terminal 2: Frontend
cd "c:\Users\hp\OneDrive\سطح المكتب\classy book\frontend"
npm start
```

#### طريقة 2: PowerShell متزامن

```powershell
cd "c:\Users\hp\OneDrive\سطح المكتب\classy book"

# Start Backend in background
Start-Job -ScriptBlock { cd .\backend; npm run start:dev } -Name "backend"

# Wait 10 seconds then start Frontend
Start-Sleep -Seconds 10
Start-Job -ScriptBlock { cd .\frontend; npm start } -Name "frontend"

# Show status
Get-Job | Format-Table Name, State
```

---

## 🎯 اختبار الميزات الأمنية:

### ✅ Test 1: DevTools Detection

```
1. سجل دخول بـ Admin account
2. اذهب إلى: http://localhost:4200/admin/monitoring
3. اضغط F12 لفتح DevTools
4. ستظهر: Alert box يقول "Your session has been terminated"
5. ستُعاد إلى صفحة Login تلقائياً
```

**النتيجة المتوقعة:**

```
✅ DevTools يفتح
✅ Alert ظهر فوراً
✅ Session cleared
✅ Redirect to login
```

---

### ✅ Test 2: Code Injection Detection

```javascript
// في Console:
eval('console.log("hacked")')  // ❌ سيتم اكتشافه

// أو
Function('console.log("hacked")')()  // ❌ سيتم اكتشافه

// أو حقن script خارجي
<script src="http://malicious.com/hack.js"></script>  // ❌ سيتم اكتشافه
```

**النتيجة المتوقعة:**

```
❌ Injection detected
✅ Logout triggered
✅ Alert displayed
```

---

### ✅ Test 3: Brute Force Protection

```powershell
# محاكاة 5 محاولات فاشلة متتالية

1. استخدم Postman أو cURL:

curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "wrong_password"
  }'

# كرر هذا 5 مرات

# المحاولة السادسة:
# الجواب: ForbiddenException - "Too many failed attempts"
```

**النتيجة المتوقعة:**

```
✅ محاولات 1-4: فشل عادي
✅ محاولة 5: فشل + IP يتم حظره تلقائياً
✅ محاولة 6: ForbiddenException
✅ في Monitoring: IP يظهر محظور
```

---

### ✅ Test 4: IP Blacklist

```bash
# الخطوة 1: الحصول على JWT Token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin_password"
  }'

# نسخ الـ access token

# الخطوة 2: حظر IP يدوياً
curl -X POST http://localhost:3000/api/v1/admin/blacklist-ip \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "192.168.1.100",
    "reason": "Suspicious Activity",
    "isPermanent": true
  }'

# الخطوة 3: محاولة login من الـ IP المحظور
# من جهاز آخر أو VPN بـ IP: 192.168.1.100

curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "correct_password"
  }'

# الجواب: ForbiddenException - "Your IP is blacklisted"
```

**النتيجة المتوقعة:**

```
✅ IP تم حظره بنجاح
✅ أي محاولة login من IP ده → مرفوضة
✅ في Monitoring: IP يظهر في Blacklist
```

---

### ✅ Test 5: User Account Locking

```bash
# الخطوة 1: الحصول على Admin Token

# الخطوة 2: قفل حساب مستخدم
curl -X POST http://localhost:3000/api/v1/admin/lock-user \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "reason": "Suspicious Activity",
    "duration": 86400000
  }'

# الخطوة 3: محاولة login بـ المستخدم المقفول
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "locked_user@example.com",
    "password": "correct_password"
  }'

# الجواب: ForbiddenException - "Account is locked"
```

**النتيجة المتوقعة:**

```
✅ الحساب تم قفله
✅ لا يقدر يدخل مطلقاً
✅ في Monitoring: User يظهر مقفول
✅ بعد 24 ساعة: يفتح تلقائياً
```

---

### ✅ Test 6: Monitoring Dashboard

```
1. سجل دخول بـ Admin
2. اذهب إلى: http://localhost:4200/admin/monitoring
3. أدخل Master Code: 1234
4. اضغط [Verify]

الصفحة ستعرض:
✅ جدول محاولات الدخول
✅ جدول الـ IPs المحظورة
✅ 4 metric cards (Successful, Failed, Blocked, Active)
✅ رسم بياني خط (Timeline)
✅ رسم بياني دائري (Distribution)

الإجراءات المتاحة:
- ✅ فك حظر IP
- ✅ تحديث البيانات (Auto-refresh: 30s)
```

---

## 📊 API Testing مع Postman:

### Import Collection:

```json
{
  "info": {
    "name": "Classy Book Security APIs",
    "version": "1.0"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/v1/auth/login",
        "body": {
          "email": "admin@example.com",
          "password": "admin_password"
        }
      }
    },
    {
      "name": "Get Login Attempts",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/v1/monitoring/login-attempts",
        "header": {
          "Authorization": "Bearer {{access_token}}"
        }
      }
    },
    {
      "name": "Get Security Metrics",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/v1/monitoring/security-metrics",
        "header": {
          "Authorization": "Bearer {{access_token}}"
        }
      }
    },
    {
      "name": "Lock User",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/v1/admin/lock-user",
        "header": {
          "Authorization": "Bearer {{access_token}}"
        },
        "body": {
          "userId": "507f1f77bcf86cd799439011",
          "reason": "Test Lock",
          "duration": 3600000
        }
      }
    },
    {
      "name": "Blacklist IP",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/v1/admin/blacklist-ip",
        "header": {
          "Authorization": "Bearer {{access_token}}"
        },
        "body": {
          "ipAddress": "192.168.1.100",
          "reason": "Test Block",
          "isPermanent": false,
          "duration": 900000
        }
      }
    }
  ]
}
```

---

## 🔍 Debugging:

### Enable Detailed Logs:

```typescript
// في backend/main.ts:
if (!isProduction) {
  app.useLogger(["debug", "log", "warn", "error"]);
}

// في frontend/src/main.ts:
if (!environment.production) {
  enableDebugTools();
}
```

### MongoDB Monitoring:

```javascript
// في MongoDB Atlas
// اذهب إلى: Databases > Performance Advisor
// لمراقبة Query Performance
```

### Browser DevTools (بعد اللـ Logout):

```javascript
// في Console (بدون DevTools Detection):
// لا تستطيع لأن الـ Service يطردك تلقاً
```

---

## 📈 Performance Testing:

### Load Testing:

```bash
# استخدم Apache Bench أو wrk:

# 100 requests, 10 concurrent:
ab -n 100 -c 10 http://localhost:3000/api/v1/monitoring/security-metrics

# Expected: < 200ms per request
```

---

## ✅ Checklist قبل الـ Production:

```
□ تغيير JWT_SECRET إلى قيمة قوية
□ تفعيل HTTPS (SSL Certificate)
□ تكوين CORS بشكل آمن
□ تفعيل Rate Limiting
□ إعداد Database Backups
□ تفعيل Database Encryption
□ تكوين Monitoring (Sentry, DataDog, إلخ)
□ إعداد Log Aggregation (ELK Stack, CloudWatch)
□ تفعيل DDoS Protection (CloudFlare, AWS Shield)
□ تشفير Sensitive Data في Database
□ إعداد Automated Tests
□ إعداد CI/CD Pipeline
□ إعداد Alert System
□ إعداد Disaster Recovery Plan
```

---

## 🐛 استكشاف الأخطاء:

### المشكلة: DevTools Detection لا يعمل

```
الحل:
1. تأكد من تحميل DevToolsDetectionService
2. اضغط F12 وانتظر ثانيتين
3. تحقق من Console logs
4. جرب refresh الصفحة
```

### المشكلة: MongoDB Connection Error

```
الحل:
1. تحقق من MONGO_URI في .env
2. تأكد من IP Whitelist في MongoDB Atlas
3. جرب الـ connection string يدوياً
4. تحقق من network connectivity
```

### المشكلة: Monitoring API بترجع 401

```
الحل:
1. تأكد من JWT Token صحيح
2. تحقق من Token expiration
3. تحقق من User Role (يجب يكون admin)
4. جرب Refresh Token
```

---

## 📝 Logs Location:

```
Backend Logs: console output
Frontend Logs: Browser Console (F12)
MongoDB Logs: MongoDB Atlas > Activity

مهم: بعد الـ Production، استخدم:
- Sentry (Error Tracking)
- Datadog (Performance Monitoring)
- ELK Stack (Log Aggregation)
```

---

**آخر تحديث:** 2024
**Status:** جاهز للـ Testing ✅

<div dir="rtl" align="right">

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Cairo&weight=700&size=40&pause=1000&color=6366F1&center=true&vCenter=true&random=false&width=600&height=100&lines=%F0%9F%93%9A+Classy+Book;%D9%85%D9%86%D8%B5%D8%A9+%D8%AA%D8%B9%D9%84%D9%8A%D9%85%D9%8A%D8%A9+%D8%B9%D9%85%D9%84%D8%A7%D9%82%D8%A9" alt="Classy Book" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/الحالة-🚧_قيد_التطوير-yellow?style=for-the-badge&labelColor=1e293b" alt="الحالة">
  <img src="https://img.shields.io/badge/الإصدار-0.1.0-blue?style=for-the-badge&labelColor=1e293b" alt="الإصدار">
  <img src="https://img.shields.io/badge/الرخصة-Private-red?style=for-the-badge&labelColor=1e293b" alt="الرخصة">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.io">
</p>

---

## 📅 آخر تحديث

<table>
<tr>
<td>📆 التاريخ</td>
<td><strong>29 يناير 2026</strong></td>
</tr>
<tr>
<td>🕐 الوقت</td>
<td><strong>04:55 م</strong></td>
</tr>
<tr>
<td>🔄 رقم التحديث</td>
<td><strong>#4</strong></td>
</tr>
</table>

---

## 📋 جدول المحتويات

<details open>
<summary><strong>🔍 اضغط للتوسيع</strong></summary>

- [🎯 نظرة عامة](#-نظرة-عامة)
- [🏗️ هيكل المشروع الفعلي](#️-هيكل-المشروع-الفعلي)
- [🛠️ التقنيات المستخدمة](#️-التقنيات-المستخدمة)
- [📦 ملفات Backend](#-ملفات-backend)
- [🎨 ملفات Frontend](#-ملفات-frontend)
- [⚡ خدمات الأداء](#-خدمات-الأداء)
- [🔧 متغيرات البيئة](#-متغيرات-البيئة)
- [🚀 التثبيت والتشغيل](#-التثبيت-والتشغيل)
- [📝 سجل التحديثات](#-سجل-التحديثات)

</details>

---

## 🎯 نظرة عامة

> **Classy Book** منصة تعليمية عملاقة مبنية بأحدث التقنيات لتقديم تجربة تعليمية سلسة وسريعة.

<table>
<tr>
<td width="50%">

### 🎯 الهدف

بناء منصة تعليمية متكاملة تدعم:

- 📹 فيديوهات تعليمية عالية الجودة
- 📝 اختبارات تفاعلية
- 💬 تواصل مباشر بين الطلاب والمعلمين
- 📊 تتبع التقدم والإحصائيات

</td>
<td width="50%">

### ⚡ المميزات التقنية

- 🚀 أداء عالي مع Redis Cache
- 📦 معالجة خلفية للملفات الثقيلة
- ☁️ تخزين سحابي مع Cloudinary
- 🔄 تحديثات فورية مع Socket.io
- 🔐 نظام مصادقة متقدم

</td>
</tr>
</table>

---

## 🏗️ هيكل المشروع الفعلي

```
📁 classy-book/
│
├── 📄 README.md                          # 📖 هذا الملف
├── 📄 .gitignore                         # 🚫 الملفات المستثناة من Git
│
├── 📂 backend/                           # 🖥️ الخادم (NestJS 11)
│   ├── 📄 package.json                   # 📦 المكتبات والأوامر
│   ├── 📄 tsconfig.json                  # ⚙️ إعدادات TypeScript
│   ├── 📄 nest-cli.json                  # 🔧 إعدادات NestJS CLI
│   ├── 📄 .env                           # 🔐 متغيرات البيئة (غير مرفوع)
│   ├── 📄 .env.example                   # 📋 نموذج متغيرات البيئة
│   │
│   └── 📂 src/                           # 📁 الكود المصدري
│       ├── 📄 main.ts                    # 🚀 نقطة البداية
│       ├── 📄 app.module.ts              # 📦 الوحدة الرئيسية
│       ├── 📄 app.controller.ts          # 🎮 المتحكم الرئيسي
│       ├── 📄 app.service.ts             # ⚙️ الخدمة الرئيسية
│       │
│       ├── 📂 cloudinary/                # ☁️ خدمة الملفات السحابية
│       │   ├── 📄 cloudinary.module.ts
│       │   ├── 📄 cloudinary.service.ts
│       │   └── 📄 index.ts
│       │
│       └── 📂 common/                    # 🔧 الأدوات المشتركة
│           ├── 📄 index.ts
│           │
│           ├── 📂 cache/                 # 🗄️ التخزين المؤقت
│           │   ├── 📄 redis-cache.module.ts
│           │   ├── 📄 redis-cache.service.ts
│           │   └── 📄 index.ts
│           │
│           ├── 📂 queue/                 # 📋 نظام الطوابير
│           │   ├── 📄 queue.module.ts
│           │   ├── 📄 index.ts
│           │   └── 📂 processors/        # ⚙️ معالجات الطوابير
│           │       ├── 📄 image-processor.service.ts
│           │       ├── 📄 video-processor.service.ts
│           │       ├── 📄 email-processor.service.ts
│           │       ├── 📄 notification-processor.service.ts
│           │       └── 📄 index.ts
│           │
│           ├── 📂 pagination/            # 📄 تقسيم البيانات
│           │   ├── 📄 pagination.module.ts
│           │   ├── 📄 pagination.service.ts
│           │   └── 📄 index.ts
│           │
│           └── 📂 response/              # 📤 تحسين الاستجابات
│               ├── 📄 response-optimizer.module.ts
│               ├── 📄 response-optimizer.service.ts
│               └── 📄 index.ts
│
└── 📂 frontend/                          # 🎨 الواجهة (Angular 21)
    ├── 📄 package.json                   # 📦 المكتبات والأوامر
    ├── 📄 angular.json                   # ⚙️ إعدادات Angular
    ├── 📄 tsconfig.json                  # ⚙️ إعدادات TypeScript
    │
    └── 📂 src/                           # 📁 الكود المصدري
        ├── 📄 main.ts                    # 🚀 نقطة البداية
        ├── 📄 index.html                 # 📄 الصفحة الرئيسية
        ├── 📄 styles.css                 # 🎨 الأنماط العامة
        │
        ├── 📂 environments/              # 🌍 إعدادات البيئات
        │   ├── 📄 environment.ts         # 🔧 بيئة التطوير
        │   └── 📄 environment.prod.ts    # 🚀 بيئة الإنتاج
        │
        └── 📂 app/                       # 📱 التطبيق
            ├── 📄 app.ts                 # 🏠 المكون الرئيسي
            ├── 📄 app.config.ts          # ⚙️ إعدادات التطبيق
            ├── 📄 app.routes.ts          # 🛤️ المسارات
            │
            └── 📂 core/                  # 🔧 النواة
                ├── 📄 index.ts
                │
                ├── 📂 services/          # ⚙️ الخدمات (10 خدمات)
                │   ├── 📄 performance.service.ts
                │   ├── 📄 caching.service.ts
                │   ├── 📄 image-optimization.service.ts
                │   ├── 📄 lazy-loading.service.ts
                │   ├── 📄 skeleton-loader.service.ts
                │   ├── 📄 memory-management.service.ts
                │   ├── 📄 http-cache.service.ts
                │   ├── 📄 debounce-throttle.service.ts
                │   ├── 📄 web-workers.service.ts
                │   └── 📄 index.ts
                │
                ├── 📂 directives/        # 📌 التوجيهات
                │   ├── 📄 scroll-animation.directive.ts
                │   ├── 📄 virtual-scroll.directive.ts
                │   └── 📄 index.ts
                │
                └── 📂 components/        # 🧩 المكونات
                    ├── 📂 skeleton-loader/
                    └── 📄 index.ts
```

---

## 🛠️ التقنيات المستخدمة

### 🖥️ Backend Stack

<table>
<tr>
<th align="center">التقنية</th>
<th align="center">الإصدار</th>
<th align="center">الوصف</th>
<th align="center">الملف</th>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS"></td>
<td><code>11.0.1</code></td>
<td>إطار عمل Node.js</td>
<td><code>app.module.ts</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB"></td>
<td><code>Atlas</code></td>
<td>قاعدة البيانات السحابية</td>
<td><code>app.module.ts</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white" alt="Mongoose"></td>
<td><code>9.1.5</code></td>
<td>ODM للتعامل مع MongoDB</td>
<td><code>app.module.ts</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis"></td>
<td><code>Latest</code></td>
<td>التخزين المؤقت السريع</td>
<td><code>redis-cache.service.ts</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Bull-FF6B6B?style=flat-square&logo=redis&logoColor=white" alt="Bull"></td>
<td><code>4.16.5</code></td>
<td>معالجة الطوابير</td>
<td><code>queue.module.ts</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white" alt="Cloudinary"></td>
<td><code>2.9.0</code></td>
<td>تخزين الملفات سحابياً</td>
<td><code>cloudinary.service.ts</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.io"></td>
<td><code>4.8.3</code></td>
<td>التواصل الفوري</td>
<td><code>package.json</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT"></td>
<td><code>11.0.2</code></td>
<td>المصادقة</td>
<td><code>package.json</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black" alt="Swagger"></td>
<td><code>11.2.5</code></td>
<td>توثيق API</td>
<td><code>package.json</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Compression-4A90D9?style=flat-square&logo=gzip&logoColor=white" alt="Compression"></td>
<td><code>1.8.1</code></td>
<td>ضغط الاستجابات</td>
<td><code>main.ts</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Helmet-000000?style=flat-square&logo=helmet&logoColor=white" alt="Helmet"></td>
<td><code>8.1.0</code></td>
<td>الحماية والأمان</td>
<td><code>package.json</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Multer-FF6600?style=flat-square&logo=files&logoColor=white" alt="Multer"></td>
<td><code>2.0.2</code></td>
<td>رفع الملفات</td>
<td><code>package.json</code></td>
</tr>
</table>

### 🎨 Frontend Stack

<table>
<tr>
<th align="center">التقنية</th>
<th align="center">الإصدار</th>
<th align="center">الوصف</th>
<th align="center">الملف</th>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Angular-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular"></td>
<td><code>21.0.0</code></td>
<td>إطار عمل الواجهة</td>
<td><code>app.ts</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></td>
<td><code>5.9.2</code></td>
<td>لغة البرمجة</td>
<td><code>tsconfig.json</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/RxJS-B7178C?style=flat-square&logo=reactivex&logoColor=white" alt="RxJS"></td>
<td><code>7.8.0</code></td>
<td>البرمجة التفاعلية</td>
<td><code>package.json</code></td>
</tr>
<tr>
<td><img src="https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white" alt="Vitest"></td>
<td><code>4.0.8</code></td>
<td>اختبارات الوحدات</td>
<td><code>package.json</code></td>
</tr>
</table>

---

## 📦 ملفات Backend

### 🚀 الملفات الرئيسية

<details>
<summary><strong>📄 main.ts - نقطة البداية</strong></summary>

```typescript
// الوظائف المفعلة:
✅ Compression - ضغط الاستجابات (threshold: 1KB, level: 6)
✅ ValidationPipe - التحقق من البيانات (whitelist, transform)
✅ CORS - السماح بالاتصال من localhost:4200
✅ Global Prefix - api/v1
```

</details>

<details>
<summary><strong>📄 app.module.ts - الوحدة الرئيسية</strong></summary>

```typescript
// الوحدات المستوردة:
✅ ConfigModule - متغيرات البيئة (isGlobal: true)
✅ MongooseModule - قاعدة البيانات (MongoDB Atlas)
✅ CloudinaryModule - تخزين الملفات السحابي
✅ RedisCacheModule - التخزين المؤقت السريع
✅ QueueModule - معالجة الطوابير (Bull)
✅ PaginationModule - تقسيم البيانات
✅ ResponseOptimizerModule - تحسين الاستجابات
```

</details>

---

### ☁️ Cloudinary Module

<table>
<tr>
<th>الملف</th>
<th>الوظيفة</th>
<th>الدوال المتاحة</th>
</tr>
<tr>
<td><code>cloudinary.module.ts</code></td>
<td>تسجيل وإعداد Cloudinary</td>
<td>-</td>
</tr>
<tr>
<td><code>cloudinary.service.ts</code></td>
<td>رفع وإدارة الملفات</td>
<td><code>uploadImage()</code>, <code>uploadVideo()</code>, <code>deleteFile()</code></td>
</tr>
</table>

---

### 🗄️ Cache Module

<table>
<tr>
<th>الملف</th>
<th>الوظيفة</th>
<th>الدوال المتاحة</th>
</tr>
<tr>
<td><code>redis-cache.module.ts</code></td>
<td>إعداد Redis مع fallback للذاكرة</td>
<td>-</td>
</tr>
<tr>
<td><code>redis-cache.service.ts</code></td>
<td>التخزين المؤقت</td>
<td><code>get()</code>, <code>set()</code>, <code>delete()</code>, <code>getOrSet()</code>, <code>deleteByPattern()</code></td>
</tr>
</table>

---

### 📋 Queue Module

<table>
<tr>
<th>الملف</th>
<th>الوظيفة</th>
<th>الطابور</th>
</tr>
<tr>
<td><code>queue.module.ts</code></td>
<td>تسجيل طوابير Bull مع Redis</td>
<td>-</td>
</tr>
<tr>
<td><code>image-processor.service.ts</code></td>
<td>ضغط وتحسين الصور</td>
<td><code>image-processing</code></td>
</tr>
<tr>
<td><code>video-processor.service.ts</code></td>
<td>معالجة وتحويل الفيديو</td>
<td><code>video-processing</code></td>
</tr>
<tr>
<td><code>email-processor.service.ts</code></td>
<td>إرسال الإيميلات</td>
<td><code>email</code></td>
</tr>
<tr>
<td><code>notification-processor.service.ts</code></td>
<td>إرسال الإشعارات</td>
<td><code>notifications</code></td>
</tr>
</table>

---

### 📄 Pagination Module

<table>
<tr>
<th>الملف</th>
<th>الوظيفة</th>
<th>الدوال المتاحة</th>
</tr>
<tr>
<td><code>pagination.module.ts</code></td>
<td>تسجيل الخدمة (Global)</td>
<td>-</td>
</tr>
<tr>
<td><code>pagination.service.ts</code></td>
<td>تقسيم البيانات</td>
<td><code>paginate()</code>, <code>cursorPaginate()</code>, <code>calculatePagination()</code></td>
</tr>
</table>

---

### 📤 Response Module

<table>
<tr>
<th>الملف</th>
<th>الوظيفة</th>
<th>الدوال المتاحة</th>
</tr>
<tr>
<td><code>response-optimizer.module.ts</code></td>
<td>تسجيل الخدمة (Global)</td>
<td>-</td>
</tr>
<tr>
<td><code>response-optimizer.service.ts</code></td>
<td>تحسين الاستجابات</td>
<td><code>optimize()</code>, <code>success()</code>, <code>error()</code>, <code>selectFields()</code></td>
</tr>
</table>

---

## 🎨 ملفات Frontend

### ⚙️ Core Services (10 خدمات)

<table>
<tr>
<th>الخدمة</th>
<th>الملف</th>
<th>الوظيفة</th>
<th>الدوال الرئيسية</th>
</tr>
<tr>
<td>🚀 Performance</td>
<td><code>performance.service.ts</code></td>
<td>قياس وتحسين الأداء</td>
<td><code>measureTime()</code>, <code>getMetrics()</code></td>
</tr>
<tr>
<td>🗄️ Caching</td>
<td><code>caching.service.ts</code></td>
<td>تخزين متعدد المستويات</td>
<td><code>get()</code>, <code>set()</code>, <code>getFromIndexedDB()</code></td>
</tr>
<tr>
<td>🖼️ Image Optimization</td>
<td><code>image-optimization.service.ts</code></td>
<td>ضغط الصور على العميل</td>
<td><code>compress()</code>, <code>resize()</code></td>
</tr>
<tr>
<td>⏳ Lazy Loading</td>
<td><code>lazy-loading.service.ts</code></td>
<td>التحميل الكسول</td>
<td><code>loadImage()</code>, <code>loadComponent()</code></td>
</tr>
<tr>
<td>💀 Skeleton Loader</td>
<td><code>skeleton-loader.service.ts</code></td>
<td>إدارة حالات التحميل</td>
<td><code>show()</code>, <code>hide()</code>, <code>isLoading$()</code></td>
</tr>
<tr>
<td>🧠 Memory Management</td>
<td><code>memory-management.service.ts</code></td>
<td>إدارة الذاكرة</td>
<td><code>cleanup()</code>, <code>trackSubscription()</code></td>
</tr>
<tr>
<td>🌐 HTTP Cache</td>
<td><code>http-cache.service.ts</code></td>
<td>Interceptor لتخزين API</td>
<td><code>intercept()</code></td>
</tr>
<tr>
<td>⏱️ Debounce/Throttle</td>
<td><code>debounce-throttle.service.ts</code></td>
<td>تقليل الطلبات</td>
<td><code>debounce()</code>, <code>throttle()</code></td>
</tr>
<tr>
<td>👷 Web Workers</td>
<td><code>web-workers.service.ts</code></td>
<td>العمليات الثقيلة</td>
<td><code>runTask()</code>, <code>terminate()</code></td>
</tr>
</table>

---

### 📌 Directives (2 توجيهات)

<table>
<tr>
<th>التوجيه</th>
<th>الملف</th>
<th>Selector</th>
<th>الوظيفة</th>
</tr>
<tr>
<td>🎬 Scroll Animation</td>
<td><code>scroll-animation.directive.ts</code></td>
<td><code>[appScrollAnimation]</code></td>
<td>تحريك العناصر عند التمرير</td>
</tr>
<tr>
<td>📜 Virtual Scroll</td>
<td><code>virtual-scroll.directive.ts</code></td>
<td><code>[appVirtualScroll]</code></td>
<td>تحميل القوائم الطويلة بكفاءة</td>
</tr>
</table>

---

### 🧩 Components

<table>
<tr>
<th>المكون</th>
<th>المجلد</th>
<th>Selector</th>
<th>الوظيفة</th>
</tr>
<tr>
<td>💀 Skeleton Loader</td>
<td><code>skeleton-loader/</code></td>
<td><code>app-skeleton-loader</code></td>
<td>عرض هيكل التحميل</td>
</tr>
</table>

---

## ⚡ خدمات الأداء

### 🔄 تدفق الـ Caching

```
┌─────────────────────────────────────────────────────────────────┐
│                        📥 API Request                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Redis Cache?   │
                    └─────────────────┘
                     /              \
                   ✅               ❌
                  /                   \
        ┌────────────┐         ┌─────────────┐
        │ Return     │         │  MongoDB    │
        │ Cached     │         │  Query      │
        └────────────┘         └─────────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │ Save to     │
                              │ Cache       │
                              └─────────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │ Return      │
                              │ Response    │
                              └─────────────┘
```

---

### 📦 تدفق معالجة الملفات

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  📤 Upload   │───▶│  📋 Queue    │───▶│  ⚙️ Process  │
│    File      │    │   (Bull)     │    │    File      │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                         ▼                    ▼                    ▼
                   ┌──────────┐         ┌──────────┐         ┌──────────┐
                   │ 🖼️ Resize│         │ 📦 Compress│       │ 🏷️ Watermark│
                   └──────────┘         └──────────┘         └──────────┘
                         │                    │                    │
                         └────────────────────┼────────────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ ☁️ Cloudinary │
                                       │    Upload    │
                                       └──────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  📎 Return   │
                                       │    URL       │
                                       └──────────────┘
```

---

## 🔧 متغيرات البيئة

### 📄 `.env` المطلوبة للـ Backend

```env
# ═══════════════════════════════════════════
# 🌐 إعدادات التطبيق
# ═══════════════════════════════════════════
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# ═══════════════════════════════════════════
# 🗄️ MongoDB Atlas
# ═══════════════════════════════════════════
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# ═══════════════════════════════════════════
# 🔐 JWT Authentication
# ═══════════════════════════════════════════
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRATION=30d

# ═══════════════════════════════════════════
# 📊 Redis (اختياري - يوجد fallback)
# ═══════════════════════════════════════════
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600

# ═══════════════════════════════════════════
# ☁️ Cloudinary
# ═══════════════════════════════════════════
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=classy-book

# ═══════════════════════════════════════════
# 🌍 CORS
# ═══════════════════════════════════════════
CORS_ORIGIN=http://localhost:4200





---

## 🚀 التثبيت والتشغيل

### 📋 المتطلبات

| الحالة | المتطلب           | الوصف                    |
| :----: | ----------------- | ------------------------ |
|   ✅   | **Node.js 20+**   | بيئة التشغيل             |
|   ✅   | **npm 10+**       | مدير الحزم               |
|   ✅   | **MongoDB Atlas** | قاعدة البيانات (مجاني)   |
|   ✅   | **Cloudinary**    | تخزين الملفات (مجاني)    |
|   ⭕   | **Redis**         | التخزين المؤقت (اختياري) |

---

### 📥 خطوات التثبيت

```bash
# 1️⃣ استنساخ المشروع
git clone https://github.com/username/classy-book.git
cd classy-book

# 2️⃣ تثبيت Backend
cd backend
npm install

# 3️⃣ إعداد متغيرات البيئة
cp .env.example .env
# قم بتعديل .env بالقيم الصحيحة

# 4️⃣ تثبيت Frontend
cd ../frontend
npm install
```

---

### ▶️ التشغيل

<table>
<tr>
<th>الخدمة</th>
<th>الأمر</th>
<th>الرابط</th>
</tr>
<tr>
<td>🖥️ Backend (Dev)</td>
<td><code>npm run start:dev</code></td>
<td>http://localhost:3000</td>
</tr>
<tr>
<td>🖥️ Backend (Prod)</td>
<td><code>npm run start:prod</code></td>
<td>http://localhost:3000</td>
</tr>
<tr>
<td>🎨 Frontend</td>
<td><code>npm start</code></td>
<td>http://localhost:4200</td>
</tr>
<tr>
<td>🧪 Tests</td>
<td><code>npm test</code></td>
<td>-</td>
</tr>
<tr>
<td>📦 Build</td>
<td><code>npm run build</code></td>
<td>-</td>
</tr>
</table>

---

### 🔗 الروابط بعد التشغيل

| الخدمة          | الرابط                       | الوصف            |
| --------------- | ---------------------------- | ---------------- |
| 🎨 Frontend     | http://localhost:4200        | واجهة المستخدم   |
| 🖥️ Backend API  | http://localhost:3000/api/v1 | نقاط الـ API     |
| 📚 Swagger Docs | http://localhost:3000/api    | توثيق API تفاعلي |

---

## 📝 سجل التحديثات

<details open>
<summary><strong>🔄 [29 يناير 2026] - تحديث #4 ⭐ (تحسينات الأداء)</strong></summary>

### ✨ إضافات جديدة للـ Backend

| الإضافة               | الملفات           | الوصف                       |
| --------------------- | ----------------- | --------------------------- |
| 🗄️ Redis Cache        | `cache/*.ts`      | تخزين مؤقت سريع مع fallback |
| 📋 Bull Queue         | `queue/*.ts`      | معالجة خلفية للملفات        |
| 📦 Compression        | `main.ts`         | ضغط الاستجابات              |
| 📄 Pagination         | `pagination/*.ts` | تقسيم البيانات              |
| 📤 Response Optimizer | `response/*.ts`   | تحسين الاستجابات            |

### 📦 المعالجات المضافة

- `image-processor.service.ts` - ضغط وتحسين الصور
- `video-processor.service.ts` - معالجة الفيديوهات
- `email-processor.service.ts` - إرسال الإيميلات
- `notification-processor.service.ts` - إرسال الإشعارات

</details>

<details>
<summary><strong>🔄 [29 يناير 2026] - تحديث #3 (الملفات والتواصل)</strong></summary>

### ✨ إضافات

- ✅ تثبيت Socket.io للتواصل الفوري
- ✅ تثبيت Cloudinary لتخزين الصور سحابياً
- ✅ إنشاء 10 خدمات أداء للـ Frontend
- ✅ إنشاء 2 Directives للتحريك والـ Virtual Scroll
- ✅ إنشاء Skeleton Loader Component

</details>

<details>
<summary><strong>🔄 [29 يناير 2026] - تحديث #2 (قاعدة البيانات)</strong></summary>

### ✨ تغييرات

- ✅ التحويل من PostgreSQL إلى MongoDB Atlas
- ✅ إعداد Mongoose ODM
- ✅ إنشاء ملفات `.env` و `.env.example`

</details>

<details>
<summary><strong>🔄 [29 يناير 2026] - تحديث #1 (الإعداد الأولي)</strong></summary>

### ✨ إضافات

- ✅ إنشاء هيكل المشروع (Backend + Frontend)
- ✅ إعداد NestJS 11 و Angular 21
- ✅ تثبيت المكتبات الأساسية للـ SaaS
- ✅ إنشاء ملف README الرئيسي

</details>

---

## 📊 إحصائيات المشروع

<table align="center">
<tr>
<td align="center">
<img src="https://img.shields.io/badge/📁_الملفات-45+-blue?style=for-the-badge" alt="Files">
</td>
<td align="center">
<img src="https://img.shields.io/badge/⚙️_الخدمات-15+-green?style=for-the-badge" alt="Services">
</td>
<td align="center">
<img src="https://img.shields.io/badge/📦_المكتبات-40+-orange?style=for-the-badge" alt="Libraries">
</td>
<td align="center">
<img src="https://img.shields.io/badge/🧪_التغطية-قريباً-gray?style=for-the-badge" alt="Coverage">
</td>
</tr>
</table>

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى اتباع الخطوات التالية:

```bash
# 1️⃣ Fork المشروع
# 2️⃣ إنشاء فرع جديد
git checkout -b feature/amazing-feature

# 3️⃣ Commit التغييرات
git commit -m 'إضافة ميزة رائعة'

# 4️⃣ رفع التغييرات
git push origin feature/amazing-feature

# 5️⃣ فتح Pull Request
```

---

<p align="center">
  <strong>صنع بـ Abdallah hany لخدمة التعليم</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made_with-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Built_with-NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/Styled_with-Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular">
</p>

<p align="center">
  <sub>© 2026 Classy Book. جميع الحقوق محفوظة.</sub>
</p>

</div>


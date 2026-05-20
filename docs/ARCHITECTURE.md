# 🏗️ Architecture

<div align="center">

**System Architecture & Design Decisions**

[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean-blue.svg)]()
[![Modular](https://img.shields.io/badge/Design-Modular-green.svg)]()

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Diagram](#system-diagram)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Database Design](#database-design)
- [Security Architecture](#security-architecture)
- [Real-time Architecture](#real-time-architecture)

---

## 🌐 Overview

Classy Book follows a **modular monolith** architecture with clear separation of concerns, making it easy to:

- 🔄 Scale individual modules
- 🧪 Test components in isolation
- 🔧 Maintain and extend features
- 🚀 Migrate to microservices if needed

---

## 📊 System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   Browser    │  │  Mobile App  │  │   API Client │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
└─────────┼─────────────────┼─────────────────┼───────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Angular 21)                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Components │ Services │ Guards │ Interceptors │ State (Signals) │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (NestJS 11)                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Guards   │  │   Pipes    │  │Interceptors│  │Middlewares │        │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘        │
│        └───────────────┴───────────────┴───────────────┘                │
│                              │                                           │
│  ┌───────────────────────────┼───────────────────────────────────────┐  │
│  │                      CONTROLLERS                                   │  │
│  │  Auth │ Users │ Monitoring │ Courses │ Lessons │ ...              │  │
│  └───────────────────────────┼───────────────────────────────────────┘  │
│                              │                                           │
│  ┌───────────────────────────┼───────────────────────────────────────┐  │
│  │                       SERVICES                                     │  │
│  │  AuthService │ UserService │ MonitoringService │ ...              │  │
│  └───────────────────────────┼───────────────────────────────────────┘  │
│                              │                                           │
│  ┌───────────────────────────┼───────────────────────────────────────┐  │
│  │                      REPOSITORIES                                  │  │
│  │  UserRepository │ SessionRepository │ AuditLogRepository │ ...    │  │
│  └───────────────────────────┼───────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │  MongoDB    │     │   Redis     │     │ Cloudinary  │
   │   Atlas     │     │   Cache     │     │   Files     │
   └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🔧 Backend Architecture

### Module Structure

```
backend/src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
│
├── common/                    # Shared utilities
│   ├── cache/                 # Redis caching
│   ├── pagination/            # Pagination service
│   ├── queue/                 # Background jobs
│   └── response/              # Response optimization
│
├── security/                  # Security modules
│   ├── auth/                  # Authentication
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/        # JWT, Local strategies
│   │   ├── guards/            # Auth guards
│   │   └── dto/               # Data transfer objects
│   │
│   ├── admin-management/      # Admin seeding
│   ├── brute-force/           # Attack prevention
│   ├── csrf/                  # CSRF protection
│   ├── rate-limit/            # Rate limiting
│   ├── sanitization/          # Input sanitization
│   ├── sessions/              # Session management
│   └── users/                 # User management
│
├── monitoring/                # Security monitoring
│   ├── monitoring.module.ts
│   ├── monitoring.controller.ts
│   ├── monitoring.service.ts
│   └── schemas/               # MongoDB schemas
│
├── performance/               # Performance features
│   ├── realtime/              # WebSocket gateway
│   ├── search/                # Search functionality
│   └── file/                  # File handling
│
└── cloudinary/                # File upload service
```

### Request Lifecycle

```
Request
    │
    ▼
┌───────────────────┐
│   Middlewares     │  ← Cookie Parser, CORS, Helmet
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│     Guards        │  ← JWT Auth, Role checks
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Interceptors    │  ← Sanitization, Logging
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│      Pipes        │  ← Validation, Transformation
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│    Controller     │  ← Handle request
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│     Service       │  ← Business logic
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│    Repository     │  ← Data access
└─────────┬─────────┘
          │
          ▼
      Response
```

### Dependency Injection

```typescript
// Module definition
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_SECRET"),
        signOptions: { expiresIn: "15m" },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 🎨 Frontend Architecture

### Module Structure

```
frontend/src/app/
├── main.ts                    # Bootstrap
├── app.ts                     # Root component
├── app.routes.ts              # Route definitions
├── app.config.ts              # App configuration
│
├── core/                      # Core functionality
│   └── services/
│       ├── auth.service.ts    # Authentication
│       ├── i18n.service.ts    # Internationalization
│       ├── theme.service.ts   # Theme management
│       ├── websocket.service.ts # Real-time
│       └── session-timer.service.ts
│
├── shared/                    # Shared resources
│   ├── components/            # Reusable components
│   │   └── admin-navbar.component.ts
│   ├── guards/                # Route guards
│   │   ├── admin.guard.ts
│   │   └── admin-login.guard.ts
│   └── interceptors/          # HTTP interceptors
│
├── pages/                     # Page components
│   ├── home/
│   ├── admin-pages/
│   │   ├── admin-login/
│   │   ├── admin-dashboard/
│   │   └── general-monitoring/
│   └── ...
│
└── environments/              # Environment configs
    ├── environment.ts
    └── environment.prod.ts
```

### Standalone Components

```typescript
// Modern Angular 21 standalone component
@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, AdminNavbarComponent],
  templateUrl: "./admin-dashboard.component.html",
  styleUrl: "./admin-dashboard.component.css",
})
export class AdminDashboardComponent {
  // Dependency injection
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Signals for reactive state
  readonly user = signal<User | null>(null);
  readonly loading = signal(false);

  // Computed values
  readonly isAdmin = computed(
    () => this.user()?.role === "admin" || this.user()?.role === "super_admin",
  );
}
```

### State Management with Signals

```typescript
// Service with signals
@Injectable({ providedIn: "root" })
export class AuthService {
  // Private writable signals
  private readonly _user = signal<User | null>(null);
  private readonly _isAuthenticated = signal(false);

  // Public readonly signals
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  // Computed values
  readonly isAdmin = computed(() => {
    const user = this._user();
    return user?.role === "admin" || user?.role === "super_admin";
  });

  // Actions
  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>("/auth/login", credentials).pipe(
      tap((response) => {
        this._user.set(response.data.user);
        this._isAuthenticated.set(true);
      }),
    );
  }
}
```

---

## 💾 Database Design

### Collections

```
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  users                    │  sessions                       │
│  ├── _id                  │  ├── _id                        │
│  ├── email                │  ├── userId                     │
│  ├── password (hashed)    │  ├── token                      │
│  ├── firstName            │  ├── ipAddress                  │
│  ├── lastName             │  ├── userAgent                  │
│  ├── role                 │  ├── expiresAt                  │
│  ├── isPrimaryAdmin       │  └── createdAt                  │
│  ├── isActive             │                                 │
│  └── createdAt            │                                 │
│                           │                                 │
│  login_attempts           │  blocked_ips                    │
│  ├── _id                  │  ├── _id                        │
│  ├── email                │  ├── ipAddress                  │
│  ├── ipAddress            │  ├── attempts                   │
│  ├── success              │  ├── reason                     │
│  ├── timestamp            │  ├── blockedUntil               │
│  ├── deviceInfo           │  └── permanent                  │
│  ├── failureReason        │                                 │
│  └── sessionId            │                                 │
│                           │                                 │
│  audit_logs               │  refresh_tokens                 │
│  ├── _id                  │  ├── _id                        │
│  ├── action               │  ├── userId                     │
│  ├── userId               │  ├── token                      │
│  ├── resourceType         │  ├── expiresAt                  │
│  ├── resourceId           │  └── createdAt                  │
│  ├── details              │                                 │
│  ├── ipAddress            │                                 │
│  └── timestamp            │                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Indexes

```typescript
// User indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

// Login attempts indexes
LoginAttemptSchema.index({ email: 1, timestamp: -1 });
LoginAttemptSchema.index({ ipAddress: 1, timestamp: -1 });
LoginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

// Blocked IPs indexes
BlockedIPSchema.index({ ipAddress: 1 }, { unique: true });
BlockedIPSchema.index({ blockedUntil: 1 });
```

---

## 🔒 Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Authentication Flow                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Login Request                                                        │
│     ┌──────────┐         ┌──────────┐         ┌──────────┐             │
│     │  Client  │ ──────► │  Guard   │ ──────► │  Service │             │
│     │          │ email   │  Local   │ verify  │   Auth   │             │
│     │          │ password│ Strategy │ user    │          │             │
│     └──────────┘         └──────────┘         └────┬─────┘             │
│                                                     │                    │
│  2. Token Generation                                ▼                    │
│     ┌──────────┐         ┌──────────┐         ┌──────────┐             │
│     │  Access  │ ◄────── │   JWT    │ ◄────── │ Validate │             │
│     │  Token   │ 15min   │  Service │ sign    │ Password │             │
│     └──────────┘         └──────────┘         └──────────┘             │
│          │                    │                                          │
│          │               ┌──────────┐                                    │
│          │               │ Refresh  │ 7 days                             │
│          │               │  Token   │                                    │
│          │               └──────────┘                                    │
│          │                    │                                          │
│  3. Token Storage             ▼                                          │
│     ┌──────────────────────────────────────────────────────────────┐    │
│     │  localStorage/sessionStorage (Access Token)                   │    │
│     │  HttpOnly Cookie (Refresh Token) - optional                   │    │
│     └──────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  4. Protected Request                                                    │
│     ┌──────────┐         ┌──────────┐         ┌──────────┐             │
│     │  Client  │ ──────► │   JWT    │ ──────► │ Controller│             │
│     │          │ Bearer  │  Guard   │ valid   │          │             │
│     │          │ Token   │          │ token   │          │             │
│     └──────────┘         └──────────┘         └──────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Security Layers

```
Request ──────────────────────────────────────────────────────► Response
    │                                                               ▲
    ▼                                                               │
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                            │
│ ├── HTTPS (TLS 1.3)                                                 │
│ ├── Rate Limiting                                                   │
│ └── IP Blocking                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 2: HTTP Security                                               │
│ ├── Helmet (Security Headers)                                       │
│ ├── CORS Configuration                                              │
│ └── CSRF Protection                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 3: Authentication                                              │
│ ├── JWT Verification                                                │
│ ├── Session Validation                                              │
│ └── Token Refresh                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 4: Authorization                                               │
│ ├── Role-Based Access Control                                       │
│ ├── Resource Ownership                                              │
│ └── Permission Checks                                               │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 5: Input Validation                                            │
│ ├── DTO Validation                                                  │
│ ├── Sanitization (XSS, Injection)                                   │
│ └── Type Checking                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 6: Audit & Monitoring                                          │
│ ├── Request Logging                                                 │
│ ├── Audit Trail                                                     │
│ └── Real-time Alerts                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Real-time Architecture

### WebSocket Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WebSocket Architecture                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐                           ┌──────────────┐            │
│  │   Client 1   │ ◄─────────────────────────│              │            │
│  │  (Browser)   │                           │              │            │
│  └──────────────┘                           │              │            │
│                                              │   Socket.IO  │            │
│  ┌──────────────┐                           │    Server    │            │
│  │   Client 2   │ ◄─────────────────────────│              │            │
│  │   (Admin)    │                           │  /realtime   │            │
│  └──────────────┘                           │              │            │
│        ▲                                    │              │            │
│        │                                    └──────┬───────┘            │
│        │                                           │                    │
│        │         ┌─────────────────────────────────┘                    │
│        │         │                                                      │
│        │         ▼                                                      │
│        │  ┌─────────────────────────────────────────────────────────┐  │
│        │  │                    ROOMS                                 │  │
│        │  ├─────────────────────────────────────────────────────────┤  │
│        │  │  monitoring    │  Admin-only room for security events   │  │
│        │  │  notifications │  User notifications                    │  │
│        │  │  chat:{roomId} │  Chat rooms                            │  │
│        │  └─────────────────────────────────────────────────────────┘  │
│        │                                                                │
│        └────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Events Flow:                                                            │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐          │
│  │ Auth Service │ ───► │   Gateway    │ ───► │  Monitoring  │          │
│  │  (Login)     │ emit │  (Realtime)  │ emit │    Room      │          │
│  └──────────────┘      └──────────────┘      └──────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Event Types

```typescript
// Server emits
interface ServerEvents {
  "monitoring:login-attempt": (data: LoginAttemptEvent) => void;
  "monitoring:ip-blocked": (data: IPBlockedEvent) => void;
  "monitoring:ip-unblocked": (data: IPUnblockedEvent) => void;
  "monitoring:security-metrics": (data: SecurityMetrics) => void;
  "notification:new": (data: Notification) => void;
}

// Client emits
interface ClientEvents {
  "join:monitoring": () => void;
  "leave:monitoring": () => void;
  "subscribe:notifications": (userId: string) => void;
}
```

---

## 📈 Scalability Considerations

### Current Architecture (Monolith)

```
┌─────────────────────────────────────────┐
│           Single Server                  │
│  ┌─────────────────────────────────────┐│
│  │  NestJS Application                 ││
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  ││
│  │  │Auth │ │Users│ │ LMS │ │ ... │  ││
│  │  └─────┘ └─────┘ └─────┘ └─────┘  ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Future Microservices (if needed)

```
┌───────────────────────────────────────────────────────────────┐
│                      API Gateway                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │  Auth   │        │  Users  │        │   LMS   │
   │ Service │        │ Service │        │ Service │
   └────┬────┘        └────┬────┘        └────┬────┘
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │ Auth DB │        │Users DB │        │ LMS DB  │
   └─────────┘        └─────────┘        └─────────┘
```

---

<div align="center">

**Built with ❤️ using Clean Architecture principles**

</div>

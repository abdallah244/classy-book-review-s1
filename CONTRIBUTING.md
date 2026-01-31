# 🤝 Contributing to Classy Book

<div align="center">

**Thank you for your interest in contributing to Classy Book!**

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Contributors](https://img.shields.io/badge/contributors-welcome-blue.svg)]()

</div>

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

---

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. We expect all contributors to:

- 🤝 Be respectful and inclusive
- 💬 Use welcoming and inclusive language
- 🎯 Focus on what is best for the community
- 🙏 Show empathy towards other community members

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js 18.x or higher
- npm or yarn
- Git
- MongoDB Atlas account (for database)
- A code editor (VS Code recommended)

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/classy-book.git
cd classy-book

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/classy-book.git
```

### Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Environment Setup

```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit with your values
code backend/.env
```

---

## 💻 Development Workflow

### Branch Naming Convention

| Type     | Pattern                | Example                       |
| -------- | ---------------------- | ----------------------------- |
| Feature  | `feature/description`  | `feature/user-authentication` |
| Bug Fix  | `fix/description`      | `fix/login-redirect`          |
| Hotfix   | `hotfix/description`   | `hotfix/security-patch`       |
| Docs     | `docs/description`     | `docs/api-documentation`      |
| Refactor | `refactor/description` | `refactor/auth-service`       |

### Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create your branch
git checkout -b feature/your-feature-name
```

### Development Commands

```bash
# Backend development
cd backend
npm run start:dev      # Start with hot reload
npm run test           # Run tests
npm run lint           # Check linting
npm run format         # Format code

# Frontend development
cd frontend
npm run start          # Start dev server
npm run test           # Run tests
npm run lint           # Check linting
npm run build          # Production build
```

---

## 📝 Commit Guidelines

We follow **Conventional Commits** specification:

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | Description                           |
| ---------- | ------------------------------------- |
| `feat`     | New feature                           |
| `fix`      | Bug fix                               |
| `docs`     | Documentation changes                 |
| `style`    | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring                      |
| `test`     | Adding or updating tests              |
| `chore`    | Maintenance tasks                     |
| `perf`     | Performance improvements              |
| `ci`       | CI/CD changes                         |

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT refresh token support"

# Bug fix
git commit -m "fix(monitoring): resolve WebSocket connection issue"

# Documentation
git commit -m "docs(api): update authentication endpoints"

# Breaking change
git commit -m "feat(api)!: change response format for user endpoints

BREAKING CHANGE: Response now includes metadata wrapper"
```

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] Documentation is updated if needed
- [ ] No console.log statements left
- [ ] No commented-out code
- [ ] Branch is up to date with main

### PR Template

When creating a PR, include:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe how to test the changes

## Screenshots (if applicable)

Add screenshots for UI changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
```

### Review Process

1. 🔍 Automated checks run
2. 👀 Code review by maintainers
3. 💬 Address feedback
4. ✅ Approval and merge

---

## 📏 Coding Standards

### TypeScript/JavaScript

```typescript
// ✅ Good
const getUserById = async (userId: string): Promise<User> => {
  const user = await this.userRepository.findById(userId);
  if (!user) {
    throw new NotFoundException("User not found");
  }
  return user;
};

// ❌ Bad
async function getUser(id) {
  var user = await this.userRepository.findById(id);
  return user;
}
```

### Angular Components

```typescript
// ✅ Good - Standalone component with signals
@Component({
  selector: "app-user-profile",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./user-profile.component.html",
})
export class UserProfileComponent {
  private readonly userService = inject(UserService);
  readonly user = signal<User | null>(null);
  readonly loading = signal(false);
}
```

### NestJS Services

```typescript
// ✅ Good - Proper dependency injection
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
}
```

### File Naming

| Type       | Convention                | Example                     |
| ---------- | ------------------------- | --------------------------- |
| Components | `kebab-case.component.ts` | `user-profile.component.ts` |
| Services   | `kebab-case.service.ts`   | `auth.service.ts`           |
| Modules    | `kebab-case.module.ts`    | `auth.module.ts`            |
| Guards     | `kebab-case.guard.ts`     | `admin.guard.ts`            |
| Interfaces | `kebab-case.interface.ts` | `user.interface.ts`         |

---

## 🧪 Testing

### Backend Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch
```

### Writing Tests

```typescript
// Backend test example
describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should validate correct credentials", async () => {
    const result = await service.validateUser("admin@test.com", "password");
    expect(result).toBeDefined();
  });
});
```

---

## 🌍 Localization

When adding new features, ensure i18n support:

```typescript
// Add translations for both languages
const translations = {
  en: {
    welcome: "Welcome",
    login: "Login",
  },
  ar: {
    welcome: "مرحباً",
    login: "تسجيل الدخول",
  },
};
```

---

## ❓ Questions?

Feel free to:

- 💬 Open a discussion
- 🐛 Create an issue
- 📧 Contact maintainers

---

<div align="center">

**Happy Contributing! 🎉**

</div>

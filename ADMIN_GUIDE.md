# 👨‍💼 Admin Guide

<div align="center">

**Complete guide for Classy Book administrators**

[![Admin](https://img.shields.io/badge/Role-Administrator-blue.svg)]()
[![Security](https://img.shields.io/badge/Access-Protected-red.svg)]()

</div>

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Admin Dashboard](#admin-dashboard)
- [Security Monitoring](#security-monitoring)
- [User Management](#user-management)
- [Session Management](#session-management)
- [Best Practices](#best-practices)

---

## 🚀 Getting Started

### First Login

1. Navigate to **http://localhost:4200/admin/login**
2. Enter default credentials:
   - Email: `admin@classybook.com`
   - Password: `12345678`
3. Click **Login**

### First-Time Setup Checklist

- [ ] Change default admin password
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Set strong JWT secrets in production
- [ ] Enable HTTPS for production
- [ ] Configure proper CORS origins
- [ ] Set up backup schedule

---

## 📊 Admin Dashboard

### Overview

The admin dashboard is your central hub for managing Classy Book.

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Navbar                                    [Timer] [Lang] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Dashboard  │  │  Monitoring │  │   Users     │            │
│  │    Home     │  │   (Live)    │  │  Management │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  Quick Actions:                                                 │
│  • View Security Metrics                                        │
│  • Check Login Attempts                                         │
│  • Manage Blocked IPs                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Features

| Feature            | Description                   |
| ------------------ | ----------------------------- |
| 📊 Quick Stats     | Overview of system metrics    |
| 🔗 Quick Actions   | Fast access to common tasks   |
| 🌐 Language Switch | Toggle between Arabic/English |
| 🎨 Theme Switch    | Light/Dark/System theme       |
| ⏱️ Session Timer   | 15-minute countdown           |

---

## 🔐 Security Monitoring

### Accessing Monitoring

1. From Dashboard, click **"Security Monitoring"**
2. Or navigate directly to `/admin/monitoring`

### Real-Time Updates

The monitoring page uses **WebSocket** for live updates. No refresh needed!

```
┌─────────────────────────────────────────────────────────────────┐
│  Security Monitoring                                    🟢 Live │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Metrics Cards:                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │    ✅    │ │    ❌    │ │    🚫    │ │    👥    │          │
│  │   150    │ │    23    │ │     5    │ │    12    │          │
│  │ Success  │ │  Failed  │ │ Blocked  │ │ Active   │          │
│  │  Logins  │ │ Attempts │ │   IPs    │ │ Sessions │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  Recent Login Attempts:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Email           │ IP         │ Status  │ Time          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ admin@...       │ 192.168... │ ✅ OK   │ 2 min ago     │   │
│  │ hacker@...      │ 10.0.0.50  │ ❌ Fail │ 5 min ago     │   │
│  │ user@...        │ 172.16...  │ ✅ OK   │ 10 min ago    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Blocked IPs:                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ IP         │ Attempts │ Reason          │ Actions       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 10.0.0.50  │    10    │ Brute force     │ [Unblock]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Understanding Metrics

| Metric               | Description               | Action Needed         |
| -------------------- | ------------------------- | --------------------- |
| ✅ Successful Logins | Valid authentications     | Normal activity       |
| ❌ Failed Attempts   | Invalid credentials       | Monitor for patterns  |
| 🚫 Blocked IPs       | Auto-blocked addresses    | Review if legitimate  |
| 👥 Active Sessions   | Currently logged in users | Monitor for anomalies |

### Managing Blocked IPs

When an IP is blocked:

1. **Automatic Block** - After 5 failed attempts in 15 minutes
2. **Block Duration** - 30 minutes by default
3. **Permanent Block** - Can be set manually

To unblock an IP:

1. Find the IP in the "Blocked IPs" table
2. Click **"Unblock"** button
3. Confirm the action

⚠️ **Warning:** Only unblock IPs you trust!

### Login Attempt Details

Each login attempt shows:

| Field          | Description                   |
| -------------- | ----------------------------- |
| Email          | Account attempted             |
| IP Address     | Source of request             |
| Status         | Success ✅ or Failure ❌      |
| Timestamp      | When it occurred              |
| Device Info    | Browser/OS information        |
| Failure Reason | Why it failed (if applicable) |

---

## 👥 User Management

### User Roles

| Role          | Permissions                           |
| ------------- | ------------------------------------- |
| `user`        | Access own content, enroll in courses |
| `admin`       | Manage content, view some reports     |
| `super_admin` | Full access, manage other admins      |

### Creating Users

```http
POST /api/v1/auth/register
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Changing User Roles

Currently done via database. Future versions will have UI:

```javascript
// MongoDB Shell
db.users.updateOne({ email: "user@example.com" }, { $set: { role: "admin" } });
```

---

## ⏱️ Session Management

### Session Timer

- **Duration:** 15 minutes of activity
- **Warning:** Alert at 2 minutes remaining
- **Auto-logout:** When timer reaches 0

### Keeping Session Active

The session timer resets with:

- Any page navigation
- Any API call
- Mouse/keyboard activity

### Manual Logout

Click the **Logout** button or navigate to `/admin/logout`

### Session Security

| Feature       | Implementation              |
| ------------- | --------------------------- |
| Token Storage | localStorage/sessionStorage |
| Token Expiry  | 15 minutes (access token)   |
| Refresh Token | 7 days                      |
| Secure Flag   | Enabled in production       |

---

## ✅ Best Practices

### Security Checklist

#### Daily Tasks

- [ ] Check security monitoring dashboard
- [ ] Review any blocked IPs
- [ ] Check for unusual login patterns

#### Weekly Tasks

- [ ] Review active sessions
- [ ] Check audit logs
- [ ] Update any suspicious accounts

#### Monthly Tasks

- [ ] Review user access levels
- [ ] Update admin passwords
- [ ] Check for security updates
- [ ] Backup database

### Password Guidelines

| Requirement | Minimum                |
| ----------- | ---------------------- |
| Length      | 8 characters           |
| Uppercase   | 1 character            |
| Lowercase   | 1 character            |
| Numbers     | 1 digit                |
| Special     | 1 symbol (recommended) |

### Suspicious Activity Signs

Watch for these patterns:

1. 🔴 **Multiple failed logins** - Same email, different IPs
2. 🔴 **Geographic anomalies** - Login from unusual locations
3. 🔴 **Time anomalies** - Activity at unusual hours
4. 🔴 **Rapid requests** - Possible automated attack
5. 🔴 **New admin accounts** - Unauthorized creation

### Incident Response

If you detect suspicious activity:

1. **Identify** - Which accounts/IPs are involved?
2. **Contain** - Block suspicious IPs immediately
3. **Investigate** - Check audit logs for details
4. **Remediate** - Reset compromised passwords
5. **Document** - Record the incident

---

## 🌐 Language Support

### Switching Languages

1. Click the language button in navbar
2. Choose **English** or **العربية**
3. Interface updates immediately

### RTL Support

Arabic language automatically enables:

- Right-to-left text direction
- Mirrored layouts
- Localized date formats

---

## 🎨 Theme Options

| Theme     | Description              |
| --------- | ------------------------ |
| ☀️ Light  | Bright theme for daytime |
| 🌙 Dark   | Dark theme for low light |
| 💻 System | Follows OS preference    |

To change:

1. Click theme button in navbar
2. Select preferred theme
3. Preference is saved automatically

---

## 🆘 Getting Help

### Common Issues

**Can't login?**

- Check email/password
- Check if IP is blocked
- Clear browser cache

**Session keeps expiring?**

- Check session timer in navbar
- Activity should reset timer
- Check for network issues

**Monitoring not updating?**

- Check WebSocket connection (🟢 indicator)
- Refresh the page
- Check browser console for errors

### Support Channels

- 📖 Documentation: `/docs/`
- 🐛 Bug Reports: GitHub Issues
- 💬 Questions: GitHub Discussions

---

<div align="center">

**Stay Secure! 🔐**

</div>

import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { adminGuard, adminLoginGuard, adminDeactivateGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Home Page
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePage),
  },

  // Auth Page
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth-page/auth-page').then((m) => m.AuthPage),
  },

  // User Dashboard (protected)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/user-dashboard/user-layout').then((m) => m.UserLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/user-dashboard/user-dashboard').then((m) => m.UserDashboard),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/user-dashboard/settings/user-settings').then((m) => m.UserSettings),
      }
    ]
  },

  // Provider Registration
  {
    path: 'provider/register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/provider-register/provider-register').then((m) => m.ProviderRegisterPage),
  },

  // Admin Routes
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        canActivate: [adminLoginGuard],
        loadComponent: () =>
          import('./pages/admin-pages/admin-login/admin-login').then((m) => m.AdminLogin),
      },
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/admin-dashboard/admin-dashboard').then(
            (m) => m.AdminDashboard,
          ),
      },
      {
        path: 'monitoring',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/general-monitoring/general-monitoring.component').then(
            (m) => m.GeneralMonitoringComponent,
          ),
      },
      {
        path: 'roles',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/roles-permissions/roles-permissions.component').then(
            (m) => m.RolesPermissionsComponent,
          ),
      },
      {
        path: 'settings',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'courses',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/courses/courses.component').then((m) => m.CoursesComponent),
      },
      {
        path: 'categories',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/categories/categories.component').then(
            (m) => m.CategoriesComponent,
          ),
      },
      {
        path: 'orders',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/orders/orders.component').then((m) => m.OrdersComponent),
      },
      {
        path: 'payments',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/payments/payments.component').then(
            (m) => m.PaymentsComponent,
          ),
      },
      {
        path: 'reviews',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/reviews/reviews.component').then((m) => m.ReviewsComponent),
      },
      {
        path: 'reports',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'analytics',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/analytics/analytics.component').then(
            (m) => m.AnalyticsComponent,
          ),
      },
      {
        path: 'notifications',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
      },
      {
        path: 'backup',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/backup/backup.component').then((m) => m.BackupComponent),
      },
      {
        path: 'activity-log',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/activity-log/activity-log.component').then(
            (m) => m.ActivityLogComponent,
          ),
      },
      {
        path: 'social-moderation',
        canActivate: [adminGuard],
        canDeactivate: [adminDeactivateGuard],
        loadComponent: () =>
          import('./pages/admin-pages/social-moderation/social-moderation').then(
            (m) => m.SocialModerationComponent,
          ),
      },
      // Redirect /admin to /admin/login
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  // Social Routes
  {
    path: 'social',
    canActivate: [authGuard],
    children: [
      {
        path: 'groups',
        loadComponent: () =>
          import('./pages/social-groups/groups-list/groups-list.component').then(
            (m) => m.GroupsListComponent,
          ),
      },
      {
        path: 'partners',
        loadComponent: () =>
          import('./pages/social-partners/partners-list/partners-list.component').then(
            (m) => m.PartnersListComponent,
          ),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./pages/social-chat/chat.component').then(
            (m) => m.ChatComponent,
          ),
      },
      {
        path: 'bookmarks',
        loadComponent: () =>
          import('./pages/social-bookmarks/bookmarks.component').then(
            (m) => m.BookmarksComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/user-profile/user-profile.component').then(
            (m) => m.UserProfileComponent,
          ),
      },
      {
        path: 'profile/:id',
        loadComponent: () =>
          import('./pages/user-profile/user-profile.component').then(
            (m) => m.UserProfileComponent,
          ),
      }
    ]
  },

  // Fallback - redirect to home
  {
    path: '**',
    redirectTo: '',
  },
];

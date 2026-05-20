// =================================
// ⚙️ Classy Book - Development Environment
// =================================

export const environment = {
  production: false,

  // 🔗 Backend API
  apiUrl: 'http://localhost:3000/api/v1',
  apiBaseUrl: 'http://localhost:3000',

  // 🔐 Authentication
  tokenKey: 'classy_book_token',
  refreshTokenKey: 'classy_book_refresh_token',
  userKey: 'classy_book_user',

  // ⏱️ Token Settings
  tokenExpirationCheckInterval: 60000, // كل دقيقة

  // 📁 File Upload
  maxFileSize: 10485760, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],

  // 🌍 App Settings
  appName: 'Classy Book',
  appVersion: '0.0.1',
  defaultLanguage: 'ar',
  supportedLanguages: ['ar', 'en'],

  // 📊 Pagination
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
};

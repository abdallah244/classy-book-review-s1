// =================================
// ⚙️ Classy Book - Production Environment
// =================================

export const environment = {
  production: true,

  // 🔗 Backend API (غيّر الرابط للـ Production)
  apiUrl: 'https://api.classybook.com/api/v1',
  apiBaseUrl: 'https://api.classybook.com',

  // 🔐 Authentication
  tokenKey: 'classy_book_token',
  refreshTokenKey: 'classy_book_refresh_token',
  userKey: 'classy_book_user',

  // ⏱️ Token Settings
  tokenExpirationCheckInterval: 60000,

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

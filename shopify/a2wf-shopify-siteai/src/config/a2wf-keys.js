export const READ_PERMISSION_KEYS = ['productCatalog', 'pricing', 'availability', 'openingHours', 'contactInfo', 'reviews', 'faq', 'companyInfo'];
export const ACTION_PERMISSION_KEYS = ['search', 'addToCart', 'checkout', 'createAccount', 'submitReview', 'submitContactForm', 'bookAppointment', 'cancelOrder', 'requestRefund'];
export const DATA_PERMISSION_KEYS = ['customerRecords', 'orderHistory', 'paymentInfo', 'internalAnalytics', 'employeeData'];

export const EXTENSION_KEYS = [
  'keySections',
  'mainContact',
  'publisher',
  'company',
  'services',
  'forms',
  'apiEndpoints',
  'search',
  'faq',
  'navigation',
  'ecommerce',
  'media',
  'careers',
  'innovations',
  'securityDefinitions',
  'alternateVersions'
];

export const DEFAULT_SHOPIFY_PERMISSION_PRESET = {
  read: {
    productCatalog: { allowed: true, rateLimit: 60 },
    pricing: { allowed: true, rateLimit: 60 },
    availability: { allowed: true, rateLimit: 30 },
    openingHours: { allowed: true },
    contactInfo: { allowed: true },
    reviews: { allowed: true, rateLimit: 20 },
    faq: { allowed: true },
    companyInfo: { allowed: true }
  },
  action: {
    search: { allowed: true, rateLimit: 20 },
    addToCart: { allowed: false, note: 'Nur freigeben, wenn der Merchant agentische Warenkorbaktionen explizit erlauben will.' },
    checkout: { allowed: false, humanVerification: true, note: 'Wenn aktiviert, sollte der letzte Schritt immer menschlich bestätigt werden.' },
    createAccount: { allowed: false },
    submitReview: { allowed: false },
    submitContactForm: { allowed: false, note: 'Wenn freigegeben, sollte eine menschliche Bestätigung oder Browser-Weiterleitung erzwungen werden.' },
    bookAppointment: { allowed: false, note: 'Wenn freigegeben, sollte der Terminabschluss menschlich bestätigt werden.' },
    cancelOrder: { allowed: false, note: 'Wenn freigegeben, nur mit menschlicher Prüfung zulassen.' },
    requestRefund: { allowed: false, note: 'Wenn freigegeben, nur mit menschlicher Prüfung zulassen.' }
  },
  data: {
    customerRecords: { allowed: false },
    orderHistory: { allowed: false },
    paymentInfo: { allowed: false },
    internalAnalytics: { allowed: false },
    employeeData: { allowed: false }
  }
};

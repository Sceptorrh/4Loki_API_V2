// Configuration for Google services
export const googleConfig = {
  // OAuth configuration
  auth: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/contacts.readonly'
    ]
  }
}; 
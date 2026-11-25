// src/utils/admin.ts

export const ADMIN_EMAILS = [
  'sleytherelax18@gmail.com',
  'sleytherjavier2025@gmail.com',
  'sleytherjavier74@gmail.com'
];

export const isMasterAdmin = (email?: string | null, metadata?: Record<string, unknown> | null): boolean => {
  if (email || metadata) {
    const clean = (email || '').toLowerCase().trim();
    if (ADMIN_EMAILS.includes(clean) || clean.startsWith('sleyther')) {
      return true;
    }

    if (metadata?.role === 'admin' || metadata?.is_admin === true) {
      return true;
    }

    return false;
  }

  return localStorage.getItem('tiender_admin_authenticated') === 'true';
};

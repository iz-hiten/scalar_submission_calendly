import { auth } from '../firebase';

// The demo/default owner UID.
// This is used when no user is logged in (demo mode).
// Set this to the real Firebase UID of the app owner so that
// meetings, event types, and availability all resolve correctly.
// To find your UID: log in once with Google, open browser console, run:
//   firebase.auth().currentUser.uid
// Or check Firestore → eventTypes collection → any document → userId field
export const DEMO_UID = 'default-user';

/**
 * Returns the current user's UID.
 * If logged in via Firebase Auth, returns the real UID.
 * Otherwise returns DEMO_UID.
 */
export function getCurrentUserId(): string {
  return auth.currentUser?.uid ?? DEMO_UID;
}

export function getCurrentUser() {
  return auth.currentUser ?? {
    uid: DEMO_UID,
    displayName: 'Hiten Mehta',
    email: 'hiten.cuchd@gmail.com',
  };
}

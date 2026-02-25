import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import { getMessaging, type Messaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Only initialize if config is present
function getFirebaseApp(): FirebaseApp | null {
    if (!firebaseConfig.apiKey) return null;
    if (getApps().length > 0) return getApps()[0];
    return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

export const db: Firestore | null = app ? getFirestore(app) : null;
export const auth: Auth | null = app ? getAuth(app) : null;

export async function ensureAnonymousLogin() {
    if (!auth) return null;
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user;
    } catch (error) {
        console.error("Anonymous auth failed:", error);
        return null;
    }
}

let _messaging: Messaging | null = null;
if (typeof window !== "undefined" && app) {
    isSupported().then((supported) => {
        if (supported) {
            _messaging = getMessaging(app);
        }
    });
}
export const messaging = () => _messaging;

/**
 * Check if Firebase is configured.
 * When not configured, the app falls back to localStorage.
 */
export function isFirebaseConfigured(): boolean {
    return !!firebaseConfig.apiKey;
}

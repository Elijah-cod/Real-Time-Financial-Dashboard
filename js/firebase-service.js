import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import {
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import {
    arrayRemove,
    arrayUnion,
    doc,
    getDoc,
    getFirestore,
    serverTimestamp,
    setDoc,
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { firebaseConfig, hasFirebaseConfig } from './firebase-config.js';

export const firebaseEnabled = hasFirebaseConfig(firebaseConfig);

let auth = null;
let db = null;

if (firebaseEnabled) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

function ensureFirebase() {
    if (!firebaseEnabled || !auth || !db) {
        throw new Error('Firebase is not configured for this project.');
    }
}

function normalizeUser(user) {
    if (!user) return null;

    return {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Investor',
        email: user.email || '—',
    };
}

export function getSyncModeLabel() {
    return firebaseEnabled ? 'Cloud Sync' : 'Local Preview';
}

export function subscribeToAuthState(callback) {
    if (!firebaseEnabled) {
        callback(null);
        return () => {};
    }

    return onAuthStateChanged(auth, user => callback(normalizeUser(user)));
}

export async function createCloudAccount({ name, email, password }) {
    ensureFirebase();

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
        await updateProfile(credential.user, { displayName: name });
    }

    await setDoc(doc(db, 'watchlists', credential.user.uid), {
        coins: [],
        displayName: name || credential.user.displayName || '',
        email: credential.user.email || email,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    return normalizeUser(auth.currentUser || credential.user);
}

export async function signInCloudAccount({ email, password }) {
    ensureFirebase();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return normalizeUser(credential.user);
}

export async function signOutCloudAccount() {
    ensureFirebase();
    await signOut(auth);
}

export async function loadCloudWatchlist(userId) {
    ensureFirebase();

    const snapshot = await getDoc(doc(db, 'watchlists', userId));
    if (!snapshot.exists()) return [];

    const data = snapshot.data();
    return Array.isArray(data.coins) ? data.coins : [];
}

export async function addCloudWatchCoin(user, coinId) {
    ensureFirebase();

    await setDoc(doc(db, 'watchlists', user.id), {
        coins: arrayUnion(coinId),
        displayName: user.name || '',
        email: user.email || '',
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

export async function removeCloudWatchCoin(user, coinId) {
    ensureFirebase();

    await setDoc(doc(db, 'watchlists', user.id), {
        coins: arrayRemove(coinId),
        displayName: user.name || '',
        email: user.email || '',
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

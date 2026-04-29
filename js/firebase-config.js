export const firebaseConfig = {
    apiKey: "AIzaSyB0L1q_Y-K4E8z_te42yy09vaIlNGA4k_k",
    authDomain: 'crypdash-9630a.firebaseapp.com',
    projectId: "crypdash-9630a",
    storageBucket: "crypdash-9630a.firebasestorage.app",
    messagingSenderId: "935974998862",
    appId: "1:935974998862:web:ae58a0e9903730029c441f",
    measurementId: "G-5DW6JDX0ZK"
};

export function hasFirebaseConfig(config = firebaseConfig) {
    const requiredValues = [config.apiKey, config.projectId, config.appId, config.messagingSenderId];
    return requiredValues.every(value => typeof value === 'string' && value.trim() && !value.startsWith('YOUR_'));
}

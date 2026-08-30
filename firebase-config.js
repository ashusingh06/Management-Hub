// Firebase Authentication & Cloud Firestore Configuration for [Management Hub]
const firebaseConfig = {
  apiKey: "AIzaSyBqjrdW8B7UR_QeQ-ADibYBNGzo4yIp0Mw",
  authDomain: "management-hub-1c14c.firebaseapp.com",
  projectId: "management-hub-1c14c",
  storageBucket: "management-hub-1c14c.firebasestorage.app",
  messagingSenderId: "568530023976",
  appId: "1:568530023976:web:0f28d8e845ad41e9a7a71d",
  measurementId: "G-YNZ0DZHR71"
};

let authInstance = null;
let googleAuthProv = null;
let firestoreDb = null;

function getFirebaseAuth() {
  if (typeof firebase === 'undefined') return null;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  if (!authInstance) {
    authInstance = firebase.auth();
    googleAuthProv = new firebase.auth.GoogleAuthProvider();
    googleAuthProv.setCustomParameters({ prompt: 'select_account' });
  }
  return { auth: authInstance, provider: googleAuthProv };
}

function getFirebaseDb() {
  if (typeof firebase === 'undefined') return null;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  if (!firestoreDb && firebase.firestore) {
    firestoreDb = firebase.firestore();
  }
  return firestoreDb;
}

async function fetchCoursesFromFirestore() {
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const doc = await db.collection('settings').doc('courses').get();
    if (doc.exists && Array.isArray(doc.data()?.list) && doc.data().list.length > 0) {
      return doc.data().list;
    }
  } catch (e) {}
  return null;
}

async function saveCoursesToFirestore(coursesList) {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    await db.collection('settings').doc('courses').set({
      list: coursesList,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e) {
    return false;
  }
}

async function signInWithGoogle() {
  const fb = getFirebaseAuth();
  if (!fb) throw new Error('Firebase SDK not loaded');
  const res = await fb.auth.signInWithPopup(fb.provider);
  const user = res.user;
  const email = (user.email || '').toLowerCase().trim();
  const isAdmin = email === 'aashishsinghh06@gmail.com';
  const userData = {
    uid: user.uid,
    name: user.displayName || email.split('@')[0],
    email: email,
    photoURL: user.photoURL || '',
    role: isAdmin ? 'admin' : 'student'
  };
  localStorage.setItem('mghub_user', JSON.stringify(userData));
  if (isAdmin) {
    sessionStorage.setItem('mghub_admin_auth', 'true');
    sessionStorage.setItem('mghub_admin_email', email);
  }
  return userData;
}

async function signOutUser() {
  const fb = getFirebaseAuth();
  if (fb && fb.auth) { try { await fb.auth.signOut(); } catch(e) {} }
  localStorage.removeItem('mghub_user');
  sessionStorage.removeItem('mghub_admin_auth');
  sessionStorage.removeItem('mghub_admin_email');
  localStorage.removeItem('mghub_jwt');
}

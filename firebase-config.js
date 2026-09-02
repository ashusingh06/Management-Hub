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
    console.error('saveCoursesToFirestore error:', e);
    return false;
  }
}

async function fetchPortalLinksFromFirestore() {
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const doc = await db.collection('settings').doc('portal_links').get();
    if (doc.exists && Array.isArray(doc.data()?.list) && doc.data().list.length > 0) {
      return doc.data().list;
    }
  } catch (e) {}
  return null;
}

async function savePortalLinksToFirestore(linksList) {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    await db.collection('settings').doc('portal_links').set({
      list: linksList,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e) {
    return false;
  }
}

async function fetchContributorsFromFirestore() {
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const doc = await db.collection('settings').doc('contributors').get();
    if (doc.exists && Array.isArray(doc.data()?.list)) {
      return doc.data().list;
    }
  } catch (e) {}
  return null;
}

async function saveContributorsToFirestore(contributorsList) {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    await db.collection('settings').doc('contributors').set({
      list: contributorsList,
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

function openPdfSecurely(url, filename = 'document.pdf') {
  if (!url || url === '#' || url === '') return;

  if (url.startsWith('data:')) {
    try {
      const arr = url.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    } catch (e) {
      console.error('Error opening data URL:', e);
    }
  }

  // Normal HTTP/HTTPS / Relative URL
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    window.location.href = url;
  }
}

function downloadPdfSecurely(url, filename = 'document.pdf') {
  if (!url || url === '#' || url === '') return;

  if (url.startsWith('data:')) {
    try {
      const arr = url.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      return;
    } catch (e) {
      console.error('Error downloading data URL:', e);
    }
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function normalizePdfUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  
  // Google Drive format: https://drive.google.com/file/d/FILE_ID/view... -> https://drive.google.com/file/d/FILE_ID/preview
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  const driveIdMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`;
  }
  
  return url;
}

async function uploadPdfToFirebaseStorage(file, courseCode) {
  if (typeof firebase === 'undefined') return null;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  if (!firebase.storage) return null;
  try {
    const storage = firebase.storage();
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = storage.ref(`notes/${courseCode}/${timestamp}_${cleanFileName}`);
    
    // Strict 8-second timeout so uploads never hang
    const uploadTask = storageRef.put(file);
    const uploadPromise = uploadTask.then(snapshot => snapshot.ref.getDownloadURL());
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout')), 8000)
    );
    
    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    return downloadUrl;
  } catch (e) {
    console.warn('Firebase storage upload fallback:', e);
    return null;
  }
}

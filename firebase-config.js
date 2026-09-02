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
    // 1. Try individual course collection
    const snapshot = await db.collection('courses').get();
    if (!snapshot.empty) {
      const list = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        if (d && d.code) list.push(d);
      });
      if (list.length > 0) return list;
    }
  } catch (e) {}

  try {
    // 2. Fallback to settings/courses doc
    const doc = await db.collection('settings').doc('courses').get();
    if (doc.exists && Array.isArray(doc.data()?.list) && doc.data().list.length > 0) {
      return doc.data().list;
    }
  } catch (e) {}
  return null;
}

async function saveCourseToFirestore(course) {
  const db = getFirebaseDb();
  if (!db || !course || !course.code) return false;
  try {
    const code = course.code.toUpperCase();
    await db.collection('courses').doc(code).set({
      ...course,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e) {
    console.error('saveCourseToFirestore error:', e);
    return false;
  }
}

async function saveCoursesToFirestore(coursesList) {
  const db = getFirebaseDb();
  if (!db || !Array.isArray(coursesList)) return false;
  try {
    // Save to settings/courses summary document
    await db.collection('settings').doc('courses').set({
      list: coursesList,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('saveCoursesToFirestore summary warning:', e);
  }

  try {
    // Save each course as its own independent document in `courses` collection
    const batch = db.batch();
    coursesList.forEach(course => {
      if (course && course.code) {
        const ref = db.collection('courses').doc(course.code.toUpperCase());
        batch.set(ref, { ...course, updatedAt: new Date().toISOString() }, { merge: true });
      }
    });
    await batch.commit();
    return true;
  } catch (e) {
    console.error('saveCoursesToFirestore batch error:', e);
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

// Real-time Cloud Firestore Subscriptions (Live Data Streaming to Mobile & Web)
function listenToCoursesFromFirestore(callback) {
  const db = getFirebaseDb();
  if (!db) return () => {};
  try {
    const unsubCol = db.collection('courses').onSnapshot((snapshot) => {
      if (!snapshot.empty) {
        const list = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          if (d && d.code) list.push(d);
        });
        if (list.length > 0) callback(list);
      }
    }, (err) => console.warn('Firestore courses collection listener:', err));

    const unsubDoc = db.collection('settings').doc('courses').onSnapshot((doc) => {
      if (doc.exists && Array.isArray(doc.data()?.list) && doc.data().list.length > 0) {
        callback(doc.data().list);
      }
    }, (err) => console.warn('Firestore settings/courses doc listener:', err));

    return () => {
      try { unsubCol(); } catch (e) {}
      try { unsubDoc(); } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}

function listenToPortalLinksFromFirestore(callback) {
  const db = getFirebaseDb();
  if (!db) return () => {};
  try {
    return db.collection('settings').doc('portal_links').onSnapshot((doc) => {
      if (doc.exists && Array.isArray(doc.data()?.list) && doc.data().list.length > 0) {
        callback(doc.data().list);
      }
    }, (err) => console.warn('Firestore realtime links listener:', err));
  } catch (e) {
    return () => {};
  }
}

function listenToContributorsFromFirestore(callback) {
  const db = getFirebaseDb();
  if (!db) return () => {};
  try {
    return db.collection('settings').doc('contributors').onSnapshot((doc) => {
      if (doc.exists && Array.isArray(doc.data()?.list)) {
        callback(doc.data().list);
      }
    }, (err) => console.warn('Firestore realtime contributors listener:', err));
  } catch (e) {
    return () => {};
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

  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try { document.body.removeChild(a); } catch (e) {}
  }, 100);
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

// ==============================================================================
// Cloudinary Direct Browser Upload (Free 25GB Storage - 24/7 Available)
// Works directly on Firebase Hosting without requiring any backend server!
// ==============================================================================
const CLOUDINARY_CONFIG = {
  cloudName: 'sendqukv',
  apiKey: '122139736221295',
  apiSecret: 'nJ9yJ5Sw7Tavp3VV09nXnYciZp8',
  folder: 'management-hub/pdfs'
};

async function computeSha1Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function uploadPdfToCloudinary(file, courseCode, onProgress = null) {
  if (!file) return null;
  return new Promise(async (resolve, reject) => {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = CLOUDINARY_CONFIG.folder;
      const strToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_CONFIG.apiSecret}`;
      const signature = await computeSha1Hex(strToSign);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
      formData.append('signature', signature);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`, true);

      if (xhr.upload && typeof onProgress === 'function') {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data && data.secure_url) {
              resolve(data.secure_url);
            } else {
              reject(new Error('Cloudinary response missing secure_url'));
            }
          } catch (err) {
            reject(new Error('Invalid JSON from Cloudinary: ' + err.message));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData?.error?.message || `Cloudinary upload error (${xhr.status})`));
          } catch (e) {
            reject(new Error(`Cloudinary upload failed with HTTP status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error while uploading PDF to Cloudinary. Please check your connection.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload timed out after 120 seconds. Please try again.'));
      };

      xhr.timeout = 120000; // 2 minutes max
      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}

async function uploadPdfToFirebaseStorage(file, courseCode, onProgress = null) {
  // Primary: Upload directly to Cloudinary (25GB Free, No Backend Required)
  try {
    const cloudUrl = await uploadPdfToCloudinary(file, courseCode, onProgress);
    if (cloudUrl) return cloudUrl;
  } catch (e) {
    console.error('Cloudinary upload error:', e);
    throw e; // Throw error so UI can display proper message
  }
  return null;
}

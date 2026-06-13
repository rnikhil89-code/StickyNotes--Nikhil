// Firebase Configuration
// IMPORTANT: Create your Firebase project at https://firebase.google.com
// Then copy your config below

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDOKKKxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
let db = null;
let auth = null;
let currentUserId = null;

async function initializeFirebase() {
  try {
    const { initializeApp } = window.firebase;
    const { getFirestore } = window.firebase.firestore;
    const { getAuth, signInAnonymously, onAuthStateChanged } = window.firebase.auth;
    
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);
    
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUserId = user.uid;
          resolve(true);
        } else {
          signInAnonymously(auth)
            .then((result) => {
              currentUserId = result.user.uid;
              resolve(true);
            })
            .catch(() => {
              resolve(false);
            });
        }
      });
    });
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return false;
  }
}

async function saveTasksToFirestore(dateKey, tasks) {
  if (!db || !currentUserId) return false;
  
  try {
    const { collection, doc, setDoc } = window.firebase.firestore;
    const tasksRef = doc(collection(db, "users", currentUserId, "tasks"), dateKey);
    await setDoc(tasksRef, { tasks, updatedAt: new Date() });
    return true;
  } catch (error) {
    console.error("Error saving tasks:", error);
    return false;
  }
}

async function loadTasksFromFirestore(dateKey) {
  if (!db || !currentUserId) return [];
  
  try {
    const { collection, doc, getDoc } = window.firebase.firestore;
    const tasksRef = doc(collection(db, "users", currentUserId, "tasks"), dateKey);
    const snapshot = await getDoc(tasksRef);
    return snapshot.exists() ? (snapshot.data().tasks || []) : [];
  } catch (error) {
    console.error("Error loading tasks:", error);
    return [];
  }
}

function subscribeToTaskUpdates(dateKey, callback) {
  if (!db || !currentUserId) return () => {};
  
  try {
    const { collection, doc, onSnapshot } = window.firebase.firestore;
    const tasksRef = doc(collection(db, "users", currentUserId, "tasks"), dateKey);
    
    return onSnapshot(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data().tasks || []);
      }
    });
  } catch (error) {
    console.error("Error subscribing to tasks:", error);
    return () => {};
  }
}

async function loadUserPreferences() {
  if (!db || !currentUserId) {
    return { view: "week", selectedDate: null };
  }
  
  try {
    const { collection, doc, getDoc } = window.firebase.firestore;
    const prefRef = doc(collection(db, "users", currentUserId), "preferences");
    const snapshot = await getDoc(prefRef);
    return snapshot.exists() ? snapshot.data() : { view: "week", selectedDate: null };
  } catch (error) {
    console.error("Error loading preferences:", error);
    return { view: "week", selectedDate: null };
  }
}

async function saveUserPreferences(view, selectedDate) {
  if (!db || !currentUserId) return false;
  
  try {
    const { collection, doc, setDoc } = window.firebase.firestore;
    const prefRef = doc(collection(db, "users", currentUserId), "preferences");
    await setDoc(prefRef, { view, selectedDate, updatedAt: new Date() });
    return true;
  } catch (error) {
    console.error("Error saving preferences:", error);
    return false;
  }
}

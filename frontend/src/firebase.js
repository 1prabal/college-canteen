import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Authenticated Firebase configuration retrieved via Firebase MCP server
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC8Ud3MMcxTuc_5ib-mhgdBIPPHs_sGlSQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sample-firebase-ai-app-c5f7e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sample-firebase-ai-app-c5f7e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sample-firebase-ai-app-c5f7e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "151496453459",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:151496453459:web:a71713e2f94894fb6005a6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  updateDoc
};


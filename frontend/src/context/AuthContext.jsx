import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  onAuthStateChanged,
  doc, 
  setDoc, 
  getDoc 
} from '../firebase';

const AuthContext = createContext(null);

const STORAGE_KEY = 'campusbites_auth_user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      id: 1,
      uid: 'demo-student-001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@college.edu',
      role: 'student', // 'student' | 'faculty' | 'canteen_staff' | 'canteen_owner' | 'platform_admin'
      userType: 'Student',
      canteenId: null,
      canteenName: null,
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      collegeId: 'CS2024-089',
      isAuthenticated: true
    };
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync to local storage for persistence across reloads (only persist authenticated users)
  useEffect(() => {
    if (currentUser && currentUser.isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  // Firebase auth state observer
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Attempt to retrieve profile from Firestore
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);
            
            let userProfile = {};
            if (userSnap.exists()) {
              userProfile = userSnap.data();
            }

            setCurrentUser((prev) => ({
              ...prev,
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || userProfile.name || 'Campus Member',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || prev.photoURL,
              role: userProfile.role || prev.role || 'student',
              canteenId: userProfile.canteenId ?? prev.canteenId,
              canteenName: userProfile.canteenName ?? prev.canteenName,
              collegeId: userProfile.collegeId || prev.collegeId,
              isAuthenticated: true,
            }));
          } catch (err) {
            console.warn('Firestore profile fetch notice:', err.message);
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase Auth listener initialized in offline mode");
    }
  }, []);

  // --- Student Registration ---
  const registerStudent = async ({ email, password, name, collegeId }) => {
    setLoading(true);
    setAuthError(null);
    try {
      let uid = 'stu-' + Date.now();
      let photoURL = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        await updateProfile(cred.user, { displayName: name });
        // Save to Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          name,
          email,
          collegeId: collegeId || 'STU-' + Math.floor(1000 + Math.random() * 9000),
          role: 'student',
          photoURL,
          createdAt: new Date().toISOString()
        });
      } catch (fbErr) {
        console.warn('Firebase createUser encountered:', fbErr.message, '- persisting session locally');
      }

      const userObj = {
        uid,
        name,
        email,
        role: 'student',
        canteenId: null,
        canteenName: null,
        collegeId: collegeId || 'STU-' + Math.floor(1000 + Math.random() * 9000),
        photoURL,
        isAuthenticated: true
      };

      setCurrentUser(userObj);
      return { success: true, user: userObj };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // --- Student Login ---
  const loginStudent = async ({ email, password }) => {
    setLoading(true);
    setAuthError(null);
    try {
      let uid = 'stu-' + Date.now();
      let displayName = email.split('@')[0];
      let photoURL = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
      let collegeId = 'CS2024-' + Math.floor(100 + Math.random() * 900);

      let role = 'student';
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        displayName = cred.user.displayName || displayName;
        photoURL = cred.user.photoURL || photoURL;

        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          collegeId = data.collegeId || collegeId;
          role = data.role || role;
        }
      } catch (fbErr) {
        console.warn('Firebase signIn notice:', fbErr.code || fbErr.message);
      }

      if (email.toLowerCase().includes('ananya') || email.toLowerCase().includes('faculty') || email.toLowerCase().includes('prof')) {
        displayName = 'Prof. Ananya Sen';
        collegeId = 'FACULTY-901';
        role = 'faculty';
      } else if (email.toLowerCase().includes('rahul') || email.toLowerCase().includes('student')) {
        displayName = 'Rahul Sharma';
        collegeId = 'CS2024-089';
        role = 'student';
      }

      const userObj = {
        id: role === 'faculty' ? 4 : 1,
        uid,
        name: displayName,
        email,
        role: role,
        userType: role === 'faculty' ? 'Faculty' : 'Student',
        canteenId: null,
        canteenName: null,
        collegeId,
        photoURL,
        isAuthenticated: true
      };

      // Sync with backend SQLite database to resolve real user.id
      try {
        const backendRes = await fetch('http://localhost:8000/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: displayName,
            college_id: collegeId,
            email: email,
            role: role
          })
        });
        if (backendRes.ok) {
          const backendUser = await backendRes.json();
          userObj.id = backendUser.id;
          userObj.name = backendUser.name || userObj.name;
          userObj.role = backendUser.role || userObj.role;
          userObj.collegeId = backendUser.college_id || userObj.collegeId;
        }
      } catch (syncErr) {
        console.warn('Backend user sync notice:', syncErr.message);
      }

      setCurrentUser(userObj);
      return { success: true, user: userObj };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // --- Canteen Manager Login ---
  const loginManager = async ({ email, password, canteenId, canteenName }) => {
    setLoading(true);
    setAuthError(null);
    try {
      let uid = 'mgr-' + Date.now();
      let displayName = 'Chef Vikram (Manager)';
      let photoURL = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=120&q=80';

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        displayName = cred.user.displayName || displayName;
        photoURL = cred.user.photoURL || photoURL;

        // Check role in Firestore
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.role === 'student') {
            throw new Error("Access Denied: This account is registered as a Student. Please use the Student Portal.");
          }
          canteenId = canteenId || data.canteenId || 1;
          canteenName = canteenName || data.canteenName || "Central Food Court";
        } else {
          // Record manager role in Firestore
          await setDoc(doc(db, 'users', uid), {
            uid,
            name: displayName,
            email,
            role: 'canteen_staff',
            canteenId: canteenId || 1,
            canteenName: canteenName || "Central Food Court",
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (fbErr) {
        if (fbErr.message?.includes("Access Denied")) {
          throw fbErr;
        }
        console.warn('Firebase manager login notice:', fbErr.message);
      }

      const userObj = {
        uid,
        name: displayName,
        email,
        role: 'canteen_staff',
        canteenId: canteenId || 1,
        canteenName: canteenName || "Central Food Court",
        collegeId: 'STAFF-' + Math.floor(100 + Math.random() * 900),
        photoURL,
        isAuthenticated: true
      };

      setCurrentUser(userObj);
      return { success: true, user: userObj };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // --- Admin Login ---
  const loginAdmin = async ({ email, password, adminKey }) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (adminKey && adminKey.trim() !== 'ADMIN-2024' && adminKey.trim() !== 'admin') {
        throw new Error("Invalid Administrator Security Key. Please verify campus credentials.");
      }

      let uid = 'adm-' + Date.now();
      let displayName = 'Prof. Ananya Sen';
      let photoURL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        displayName = cred.user.displayName || displayName;
        photoURL = cred.user.photoURL || photoURL;

        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.role !== 'admin') {
            throw new Error("Access Denied: This account lacks Administrator privileges.");
          }
        } else {
          // Record Admin role in Firestore
          await setDoc(doc(db, 'users', uid), {
            uid,
            name: displayName,
            email,
            role: 'admin',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (fbErr) {
        if (fbErr.message?.includes("Access Denied") || fbErr.message?.includes("Administrator Security Key")) {
          throw fbErr;
        }
        console.warn('Firebase admin login notice:', fbErr.message);
      }

      const userObj = {
        uid,
        name: displayName,
        email,
        role: 'admin',
        canteenId: null,
        canteenName: null,
        collegeId: 'FACULTY-901',
        photoURL,
        isAuthenticated: true
      };

      setCurrentUser(userObj);
      return { success: true, user: userObj };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // --- Google OAuth Sign In with Role Selection ---
  const loginWithGoogle = async (intendedRole = 'student', customData = {}) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      let role = intendedRole;
      if (user.email?.includes('staff') || user.email?.includes('canteen')) {
        role = 'canteen_staff';
      } else if (user.email?.includes('admin')) {
        role = 'admin';
      }

      // Check / update Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || 'Campus User',
          email: user.email,
          photoURL: user.photoURL,
          role: role,
          canteenId: customData.canteenId || null,
          canteenName: customData.canteenName || null,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore sync notice:', fsErr.message);
      }

      const userObj = {
        uid: user.uid,
        name: user.displayName || 'Campus User',
        email: user.email,
        photoURL: user.photoURL,
        role: role,
        canteenId: customData.canteenId || null,
        canteenName: customData.canteenName || null,
        collegeId: 'CAMPUS-' + Math.floor(1000 + Math.random() * 9000),
        isAuthenticated: true,
      };

      setCurrentUser(userObj);
      return { success: true, user: userObj };
    } catch (error) {
      console.warn("Google signIn notice, defaulting to simulated session:", error.message);
      const roleProfiles = {
        student: {
          uid: 'stu-demo',
          name: 'Rahul Sharma',
          email: 'rahul.sharma@college.edu',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
          role: 'student',
          collegeId: 'CS2024-089',
          isAuthenticated: true
        },
        canteen_staff: {
          uid: 'mgr-demo',
          name: 'Chef Vikram',
          email: 'vikram.chef@canteen.college.edu',
          photoURL: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=120&q=80',
          role: 'canteen_staff',
          canteenId: customData.canteenId || 1,
          canteenName: customData.canteenName || "Central Food Court",
          collegeId: 'STAFF-102',
          isAuthenticated: true
        },
        admin: {
          uid: 'adm-demo',
          name: 'Prof. Ananya Sen',
          email: 'ananya.sen@college.edu',
          photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
          role: 'admin',
          collegeId: 'FACULTY-901',
          isAuthenticated: true
        }
      };

      const userObj = roleProfiles[intendedRole] || roleProfiles.student;
      setCurrentUser(userObj);
      return { success: true, user: userObj };
    } finally {
      setLoading(false);
    }
  };

  // --- Quick 1-Click Demo Login ---
  const quickDemoLogin = (role, extra = {}) => {
    setLoading(true);
    let demoUser;
    if (role === 'canteen_staff') {
      demoUser = {
        id: 2,
        uid: 'mgr-demo',
        name: 'Suresh Kumar',
        email: 'suresh.staff@canteen.college.edu',
        role: 'canteen_staff',
        userType: 'Staff',
        canteenId: extra.canteenId || 1,
        canteenName: extra.canteenName || "Main Food Court",
        collegeId: 'STAFF-001',
        photoURL: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=120&q=80',
        isAuthenticated: true
      };
    } else if (role === 'admin' || role === 'platform_admin') {
      demoUser = {
        id: 3,
        uid: 'adm-demo',
        name: 'Admin User',
        email: 'admin@campusbites.edu',
        role: 'admin',
        userType: 'Platform Admin',
        canteenId: null,
        canteenName: null,
        collegeId: 'ADMIN-001',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        isAuthenticated: true
      };
    } else if (role === 'faculty') {
      demoUser = {
        id: 4,
        uid: 'fac-demo',
        name: 'Prof. Ananya Sen',
        email: 'ananya.sen@college.edu',
        role: 'faculty',
        userType: 'Faculty',
        canteenId: null,
        canteenName: null,
        collegeId: 'FACULTY-901',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        isAuthenticated: true
      };
    } else if (role === 'canteen_owner') {
      demoUser = {
        id: 7,
        uid: 'owner-demo',
        name: 'Chef Vikram',
        email: 'vikram.owner@campusbites.edu',
        role: 'canteen_owner',
        userType: 'Canteen Owner',
        canteenId: extra.canteenId || 1,
        canteenName: extra.canteenName || "Main Food Court",
        collegeId: 'OWNER-001',
        photoURL: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=120&q=80',
        isAuthenticated: true
      };
    } else {
      demoUser = {
        id: 1,
        uid: 'stu-demo',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@college.edu',
        role: 'student',
        userType: 'Student',
        canteenId: null,
        canteenName: null,
        collegeId: 'CS2024-089',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        isAuthenticated: true
      };
    }

    setCurrentUser(demoUser);
    setLoading(false);
    return demoUser;
  };

  // --- Logout ---
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    const guestUser = {
      id: null,
      uid: 'guest-' + Date.now(),
      name: 'Guest Visitor',
      email: null,
      photoURL: null,
      role: 'student',
      userType: 'Guest',
      canteenId: null,
      canteenName: null,
      collegeId: null,
      isAuthenticated: false,
      isGuest: true
    };
    setCurrentUser(guestUser);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchRole = (newRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role: newRole,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authError,
        setAuthError,
        loginStudent,
        registerStudent,
        loginManager,
        loginAdmin,
        loginWithGoogle,
        quickDemoLogin,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

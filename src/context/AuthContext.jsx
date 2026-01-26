// src/context/AuthContext.jsx
import React, { useState, createContext, useContext, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { auth, db } from '../../firebaseConfig';

const AuthContext = createContext();

// 1. Keep the named export for the hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 2. Change AuthProvider to a default export
export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isAuthReady, setIsAuthReady] = useState(false); 

  // --- Theme State ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement; 
    const oldTheme = theme === 'light' ? 'dark' : 'light';
    
    root.classList.remove(oldTheme);
    root.classList.add(theme);
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  // ------------------------------------------

  useEffect(() => {
    let firestoreUnsubscribe = null; 

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
        firestoreUnsubscribe = null;
      }

      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        firestoreUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firestoreData.firstName || firebaseUser.email?.split('@')[0],
              role: firestoreData.role || 'intern',
              ...firestoreData,
            };
            
            setUser(userData); 
            setIsAuthenticated(true);
          } else {
            console.warn("User document not found, using default auth data.");
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: 'Guest', role: 'intern' });
            setIsAuthenticated(true);
          }
          setLoading(false);
          setIsAuthReady(true);
        }, (error) => {
          console.error('Error listening to user data:', error);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: 'Guest', role: 'intern' });
          setIsAuthenticated(true);
          setLoading(false);
          setIsAuthReady(true);
        });

      } else {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        setIsAuthReady(true); 
      }
    });

    return () => {
      authUnsubscribe(); 
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe(); 
      }
    };
  }, []);

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsAuthReady(false);
    await signOut(auth);
  };
  
  const value = {
    isAuthenticated,
    user,
    loading,
    logout,
    theme,
    toggleTheme,
    isAuthReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  ministry: string | null;
  isSuperAdmin: boolean;
  isSecretary: boolean;
  isMinistryLeader: boolean;
  isFinance: boolean;
  canEditMembership: boolean;
  canEditSundaySchool: boolean;
  canEditFinancials: boolean;
  canDelete: boolean;
  canExport: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [ministry, setMinistry] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if user exists in Firestore, if not create them
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const isDefaultAdmin = user.email === "paulekuadzi@gmail.com";
          const initialRole = isDefaultAdmin ? "Super Admin" : "User";
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: initialRole,
            ministry: null,
            createdAt: new Date().toISOString()
          });
          setRole(initialRole);
          setMinistry(null);
        } else {
          const data = userDoc.data();
          let userRole = data?.role || "User";
          if (user.email === "paulekuadzi@gmail.com" && userRole !== "Super Admin") {
            userRole = "Super Admin";
            await updateDoc(userDocRef, { role: "Super Admin" });
          }
          setRole(userRole);
          setMinistry(data?.ministry || null);
        }
      } else {
        setRole(null);
        setMinistry(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isSuperAdmin = role === "Super Admin";
  const isSecretary = role === "Secretary";
  const isMinistryLeader = role === "Ministry Leader";
  const isFinance = role === "Finance";
  
  const canEditMembership = isSuperAdmin || isSecretary;
  const canEditSundaySchool = isSuperAdmin || isSecretary;
  const canEditFinancials = isSuperAdmin || isFinance;
  const canDelete = isSuperAdmin;
  const canExport = isSuperAdmin || isFinance;

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      loading, 
      role, 
      ministry,
      isSuperAdmin, 
      isSecretary, 
      isMinistryLeader,
      isFinance,
      canEditMembership,
      canEditSundaySchool,
      canEditFinancials,
      canDelete,
      canExport,
      login, 
      logout 
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

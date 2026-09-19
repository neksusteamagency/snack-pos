import { createContext, useContext, useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

const AuthContext = createContext(null);
const SESSION_KEY = "pos_session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseReady(true);
      } else {
        signInAnonymously(auth).catch((err) => {
          console.error("Anonymous sign-in failed:", err);
          setError("Could not connect. Check your internet connection.");
        });
      }
    });
    return () => unsub();
  }, []);

  async function loginWithPin(pin) {
    setError("");
    if (!pin || pin.length < 4) {
      setError("Enter a valid PIN.");
      return false;
    }
    try {
      const staffRef = collection(db, "staff");
      const q = query(staffRef, where("pin", "==", pin));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("Incorrect PIN.");
        return false;
      }
      const staffDoc = snap.docs[0].data();
      const newSession = { name: staffDoc.name, role: staffDoc.role };
      setSession(newSession);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      return true;
    } catch (err) {
      console.error("PIN lookup failed:", err);
      setError("Could not verify PIN. Check your connection and try again.");
      return false;
    }
  }

  function logout() {
    setSession(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{ session, firebaseReady, error, loginWithPin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
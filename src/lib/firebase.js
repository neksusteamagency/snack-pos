import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyAZr6jIHWdT0L_2PF2ndhjUgdISlzL4QMM",
  authDomain: "snack-pos-2de85.firebaseapp.com",
  projectId: "snack-pos-2de85",
  storageBucket: "snack-pos-2de85.firebasestorage.app",
  messagingSenderId: "773104120540",
  appId: "1:773104120540:web:9154766797972c30fbba19"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export const auth = getAuth(app);
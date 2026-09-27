import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDEagFm2p0Zv2o4ISC3j1bVsm8v3B8wGbM",
  authDomain: "panelia-937e8.firebaseapp.com",
  projectId: "panelia-937e8",
  storageBucket: "panelia-937e8.firebasestorage.app",
  messagingSenderId: "889603404922",
  appId: "1:889603404922:web:fbd95de010c45d9a93f7c3",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
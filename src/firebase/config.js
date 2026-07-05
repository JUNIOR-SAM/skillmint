import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAAha9U1mOQURp2TsXULSaMb4beMQVKznI",
  authDomain: "skillmint-171fe.firebaseapp.com",
  projectId: "skillmint-171fe",
  storageBucket: "skillmint-171fe.firebasestorage.app",
  messagingSenderId: "1017445275400",
  appId: "1:1017445275400:web:6bf81c2206eb53f5523ebd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db for use anywhere in the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
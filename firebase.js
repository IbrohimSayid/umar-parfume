// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAOpfGUMSd-iwoQfFRdHTTroU9PRbHsWo8",
  authDomain: "umar-parfume.firebaseapp.com",
  projectId: "umar-parfume",
  storageBucket: "umar-parfume.appspot.com",
  messagingSenderId: "11131072059",
  appId: "1:11131072059:web:3d87de297bf5a88204361e",
  measurementId: "G-L04YP5F21P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
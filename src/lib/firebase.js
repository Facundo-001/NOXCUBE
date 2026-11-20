import { initializeApp } from 'firebase/app';
import { setDoc } from 'firebase/firestore';
import {
    getAuth,
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    deleteUser 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
    apiKey: "AIzaSyDV96rnGbSgyIRCkRRXNHN0PZzWJ6x2utM",
    authDomain: "noxcubesocial.firebaseapp.com",
    projectId: "noxcubesocial",
    storageBucket: "noxcubesocial.firebasestorage.app",
    messagingSenderId: "438732953163",
    appId: "1:438732953163:web:a3be3eae19fb766a391fce"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export {
    signInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    deleteUser ,
    sendPasswordResetEmail,
    setDoc
};







// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// CONFIGURACIÓN CORRECTA Y COMPLETA DE TU PROYECTO FIREBASE
// (Basada en tu última captura de pantalla de "Configuración del SDK")
const firebaseConfig = {
  apiKey: "AIzaSyAff-MNOtgKk6gG_WqdxzPnI3MtceVVc",
  authDomain: "finanzasmul-8d731.firebaseapp.com",
  projectId: "finanzasmul-8d731",
  storageBucket: "finanzasmul-8d731.appspot.com",
  messagingSenderId: "31143773893",
  appId: "1:31143773893:web:6e594d5e967b72611162ac",
  measurementId: "G-PM594WT6B0" // Este también estaba en tu captura, es bueno incluirlo
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore y exportarlo para usarlo en otros archivos
// (Conectándose a la base de datos por defecto de tu proyecto)
export const db = getFirestore(app);

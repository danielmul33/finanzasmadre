// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza esto con la configuración de TU proyecto Firebase
// Encuéntrala en tu Consola de Firebase:
// Configuración del proyecto (icono de engranaje) > Tus apps > Configuración (abajo)
const firebaseConfig = {
  apiKey: "AIzaSyAfF-MNOtgkK6lgG_WQdxcPni3MtcEvNVc",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "finanzasmul-8d731D",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore y exportarlo para usarlo en otros archivos
export const db = getFirestore(app);

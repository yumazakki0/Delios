import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase Admin não configurado no ambiente da Vercel.");
}

// Credenciais administrativas existem apenas no servidor. Zero rolê delas no Vite.
const adminApp = getApps()[0] ?? initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedAdminApp: App | null = null;

function withoutWrappingQuotes(value: string) {
  const trimmed = value.trim();
  const first = trimmed.at(0);
  const last = trimmed.at(-1);
  return first && first === last && (first === '"' || first === "'")
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

function getAdminApp() {
  if (cachedAdminApp) return cachedAdminApp;

  const projectId = withoutWrappingQuotes(process.env.FIREBASE_ADMIN_PROJECT_ID ?? "");
  const clientEmail = withoutWrappingQuotes(process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? "");
  const privateKey = withoutWrappingQuotes(process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "")
    .replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("SERVER_CONFIG_MISSING");
  }

  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")
    || !privateKey.includes("-----END PRIVATE KEY-----")) {
    throw new Error("SERVER_CONFIG_INVALID_KEY");
  }

  try {
    cachedAdminApp = getApps()[0] ?? initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return cachedAdminApp;
  } catch {
    // Não jogue detalhes da credencial nos logs. Só a classificação segura do erro.
    throw new Error("SERVER_CONFIG_INVALID_KEY");
  }
}

// A inicialização é tardia: ENV incorreto vira JSON legível em vez de derrubar a função.
export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

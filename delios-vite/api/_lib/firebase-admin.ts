import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedAdminApp: App | null = null;

function withoutWrappingQuotes(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  return first && first === last && (first === '"' || first === "'")
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

function normalizePrivateKey(value: string) {
  return withoutWrappingQuotes(value)
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function readServiceAccountFromEnv() {
  const directProjectId = withoutWrappingQuotes(process.env.FIREBASE_ADMIN_PROJECT_ID ?? "");
  const directClientEmail = withoutWrappingQuotes(process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? "");
  const directPrivateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "");

  if (directProjectId && directClientEmail && directPrivateKey) {
    return { projectId: directProjectId, clientEmail: directClientEmail, privateKey: directPrivateKey };
  }

  const jsonValue = process.env.FIREBASE_ADMIN_CREDENTIALS ?? process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ?? "";
  if (!jsonValue) return null;

  try {
    const parsed = JSON.parse(withoutWrappingQuotes(jsonValue)) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    const projectId = withoutWrappingQuotes(parsed.project_id ?? "");
    const clientEmail = withoutWrappingQuotes(parsed.client_email ?? "");
    const privateKey = normalizePrivateKey(parsed.private_key ?? "");

    if (projectId && clientEmail && privateKey) {
      return { projectId, clientEmail, privateKey };
    }

    return null;
  } catch {
    return null;
  }
}

function getAdminApp() {
  if (cachedAdminApp) return cachedAdminApp;

  const config = readServiceAccountFromEnv();
  const projectId = config?.projectId ?? "";
  const clientEmail = config?.clientEmail ?? "";
  const privateKey = config?.privateKey ?? "";

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

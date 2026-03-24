// src/lib/firebase.client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// =================================================================================
// IMPORTANT: Paste your Firebase project's web app configuration here.
// You can find this in the Firebase Console:
// Project settings > General > Your apps > Web app > SDK setup and configuration
// =================================================================================
const config = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE", // e.g., your-project-id.firebaseapp.com
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE", // Optional
  // measurementId: "PASTE_YOUR_MEASUREMENT_ID_HERE", // Optional
};

const functionsRegion = "us-central1";

if (!config.apiKey || config.apiKey.includes("PASTE_YOUR")) {
  // This warning only shows in the developer console.
  // It won't crash the app anymore, but it's a reminder to configure Firebase.
  console.warn("Firebase config is missing or using placeholder values. Please paste your web app config in src/lib/firebase.client.ts");
}

const app = getApps().length ? getApps()[0] : initializeApp(config);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, functionsRegion);

export async function callCreateTestMarket(title: string) {
  const r = await fetch("/api/admin/markets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!r.ok) throw new Error(`callCreateTestMarket ${r.status}`);
  return r.json();
}

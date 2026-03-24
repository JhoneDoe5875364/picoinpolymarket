// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This file is used for server-side Firebase operations.
// It initializes the Firebase Admin SDK, which has elevated privileges.

// Note: In a deployed Firebase/Google Cloud environment (like Cloud Functions or App Hosting),
// the SDK will automatically find the necessary service account credentials.
// For local development, you'd need to set the GOOGLE_APPLICATION_CREDENTIALS
// environment variable to point to your service account key file.

export async function initFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return; // Already initialized
  }

  try {
    // When deployed, this will automatically use the project's service account
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error", error);
    // Throwing the error can help debug issues where the service account
    // might not have the right permissions or is not found.
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}

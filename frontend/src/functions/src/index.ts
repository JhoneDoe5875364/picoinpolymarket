// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

export const createTestMarket = functions
  .region("us-central1")
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in first.");
    }

    const docRef = db.collection("markets").doc();
    await docRef.set({
      id: docRef.id,
      question: "Will BTC close above $70k this month?",
      description: "Seeded by callable function.",
      category: "Crypto",
      status: "open",
      volume: 0,
      yesPrice: 0.5,
      outcome: null,
      endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 3600 * 1000)),
      fees: { txBps: 200, resolutionBps: 300 },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      visibility: "public",
      resolution: { method: "admin" as const },
    });

    return { ok: true, id: docRef.id };
  });

const marketSchema = z.object({
  question: z.string().min(10),
  description: z.string().min(20),
  category: z.string().min(3),
  endDate: z.string().nullable(),
});

export const createMarket = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in first.");
    }

    const validation = marketSchema.safeParse(data);
    if (!validation.success) {
      console.error("Market data validation failed:", validation.error);
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid market data: ${validation.error.message}`
      );
    }

    const { question, description, category, endDate } = validation.data;
    
    try {
      const docRef = db.collection("markets").doc();
      await docRef.set({
        id: docRef.id,
        question,
        description,
        category,
        status: "open",
        volume: 0,
        yesPrice: 0.5,
        outcome: null,
        endDate: endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null,
        fees: { txBps: 200, resolutionBps: 300 },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
        visibility: "public",
        resolution: { method: "admin" as const },
      });
      
      return { ok: true, id: docRef.id };
    } catch (error: any) {
      console.error("Error creating market:", error);
      throw new functions.https.HttpsError("internal", "Failed to create market in database.", error.message);
    }
  });

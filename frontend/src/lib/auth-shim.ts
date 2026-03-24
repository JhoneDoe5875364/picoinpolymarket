/**
 * Minimal stand-in for Firebase Auth so the app compiles and runs.
 * Swap this file for a real Firebase client when you’re ready.
 */
export const auth = {} as any;

export async function signInWithCustomToken(_: any, __: string) {
  // Return something shaped like a Firebase UserCredential
  return { user: { uid: "pi-session" } };
}

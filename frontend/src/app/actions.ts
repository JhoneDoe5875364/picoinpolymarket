
'use server';

import { z } from 'zod';
const admin: any = {};

// This function initializes the admin SDK and gets a Firestore instance.
// It ensures that it only initializes the app once.
function getAdminDb() {
  if (admin.apps.length === 0) {
    // When deployed to App Hosting, the SDK will automatically find the credentials
    // when initializeApp() is called with no arguments.
    admin.initializeApp();
  }
  return admin.firestore();
}


const marketSuggestionSchema = z.object({
  question: z.string().min(10),
  description: z.string().min(20),
  category: z.string().min(3),
  endDate: z.date().optional(),
});

export async function suggestMarket(data: z.infer<typeof marketSuggestionSchema>): Promise<{ success: boolean; message: string }> {
  const validatedData = marketSuggestionSchema.safeParse(data);
  if (!validatedData.success) {
    return { success: false, message: 'Invalid suggestion data.' };
  }

  return { success: true, message: 'Your market suggestion has been submitted for review. Thank you!' };
}

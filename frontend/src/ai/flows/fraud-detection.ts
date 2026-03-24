
'use server';

/**
 * @fileOverview Fraud detection flow for identifying suspicious trades.
 *
 * - detectTradeFraud - A function that analyzes trade data and provides a fraud score.
 * - DetectTradeFraudInput - The input type for the detectTradeFraud function.
 * - DetectTradeFraudOutput - The return type for the detectTradeFraud function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectTradeFraudInputSchema = z.object({
  userId: z.string().describe('The ID of the user placing the trade.'),
  marketId: z.string().describe('The ID of the market the trade is for.'),
  side: z.enum(['yes', 'no']).describe('The side of the trade (yes or no).'),
  amountPi: z.number().describe('The amount of Pi used in the trade.'),
  userIpAddress: z.string().optional().describe('The IP address of the user placing the trade.'),
  userAgent: z.string().optional().describe('The user agent of the user placing the trade.'),
});
export type DetectTradeFraudInput = z.infer<typeof DetectTradeFraudInputSchema>;

const DetectTradeFraudOutputSchema = z.object({
  fraudScore: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'A score between 0 and 1 indicating the likelihood of fraud, with 1 being highly fraudulent.'
    ),
  reason: z.string().describe('The reasoning behind the assigned fraud score. Be concise and clear.'),
  isSuspicious: z.boolean().describe('Whether the trade should be blocked or flagged for review based on the fraud score.'),
});
export type DetectTradeFraudOutput = z.infer<typeof DetectTradeFraudOutputSchema>;

export async function detectTradeFraud(input: DetectTradeFraudInput): Promise<DetectTradeFraudOutput> {
  return detectTradeFraudFlow(input);
}

const fraudDetectionPrompt = ai.definePrompt({
  name: 'fraudDetectionPrompt',
  input: {schema: DetectTradeFraudInputSchema},
  output: {schema: DetectTradeFraudOutputSchema},
  prompt: `You are a highly advanced fraud detection expert for a prediction market platform. Your task is to analyze trade data and provide a precise fraud score.

  Analyze the following trade data:
  - User ID: {{{userId}}}
  - Market ID: {{{marketId}}}
  - Prediction: {{{side}}}
  - Amount (Pi): {{{amountPi}}}
  - User IP Address: {{{userIpAddress}}}
  - User Agent: {{{userAgent}}}

  Evaluate the data based on these criteria:
  1.  **Unusual Trade Amount**: Is the amount unusually large for a typical user? (e.g., > 10,000 Pi).
  2.  **Velocity**: Multiple high-value trades from the same user or IP in a short period. (Note: You don't have historical data, but you can infer risk).
  3.  **Suspicious User Agent**: Does the user agent indicate a script or bot rather than a standard browser? (e.g., missing standard browser tokens, including "python-requests", "curl").
  4.  **IP/Geo Mismatch**: Does the IP address suggest a proxy, VPN, or location inconsistent with typical user behavior? (Note: You don't have location data, but acknowledge this as a potential factor in your reasoning).

  Instructions:
  - Return a JSON object matching the output schema.
  - **fraudScore**: A number from 0.0 to 1.0. A score of 0.0 is no risk. A score of 1.0 is certain fraud.
  - **isSuspicious**: Set to \`true\` if the \`fraudScore\` is greater than 0.75, otherwise set to \`false\`.
  - **reason**: Provide a brief, clear explanation for your score, mentioning the specific factors that contributed to your assessment. If the trade is safe, say so.
`,
});

const detectTradeFraudFlow = ai.defineFlow(
  {
    name: 'detectTradeFraudFlow',
    inputSchema: DetectTradeFraudInputSchema,
    outputSchema: DetectTradeFraudOutputSchema,
  },
  async input => {
    try {
      const {output} = await fraudDetectionPrompt(input);
      return output!;
    } catch (error) {
      console.error("Error during fraud detection AI call:", error);
      // If the AI service fails, default to a non-fraudulent response
      // to avoid blocking legitimate trades due to a service outage.
      return {
        fraudScore: 0,
        reason: "Fraud check could not be completed due to a temporary system error. Assuming low risk.",
        isSuspicious: false,
      };
    }
  }
);

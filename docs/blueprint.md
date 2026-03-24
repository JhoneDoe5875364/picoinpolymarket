# **App Name**: Predict Pix

## Core Features:

- User Authentication via Pi Wallet: Allow users to log in securely using their Pi Wallet in the Pi Browser. Authenticate and authorize users using the Pi SDK and handle server-side sessions.
- Market Creation: Enable administrators to manually create prediction markets, defining the question, category, tier, and end date.
- Prediction Placement: Allow users to place predictions (YES/NO) on open markets using Pi. Ensure markets are open and the end date hasn't passed.
- Market Resolution: Allow admins to resolve markets by setting the outcome (YES/NO). The system will then compute payouts for winning predictions.
- Payout Calculation: Automatically calculate and distribute payouts to users who placed winning predictions when a market is resolved. Platform wallet covers chain fees.
- Referral Program: Implement a referral program where users can invite others using a unique referral code. The referrer receives a percentage of the fees from trades made by their referrals.
- Fraud detection: Use a tool to provide fraud scoring of each trade. Allow admin to block suspect accounts.

## Style Guidelines:

- Color scheme will use a dark theme. Primary color: vibrant orange (#FF7A1C) to capture the essence of excitement and financial dynamism.
- Background color: dark desaturated orange (#0A0908). Chosen to complement the primary while providing a sophisticated, muted backdrop, conducive for a dark theme.
- Accent color: a pink tone (#FF69B4), located close to the orange primary color on the color wheel, yet differentiated in brightness and saturation.
- Headline font: 'Space Grotesk' sans-serif for headlines and shorter body text, providing a techy, modern feel.
- Body font: 'Inter' sans-serif for longer body text when 'Space Grotesk' is used for headlines, ensuring readability.
- Code font: 'Source Code Pro' monospace to clearly render code snippets.
- Neon-outlined icons in a bright, electric blue. Use a consistent style throughout the application.
- Cards should have a background color of #0C0F1C. All elements should follow accessible contrast standards. Large tap targets.
- Subtle animations on UI elements such as button hover and transition animations between pages to provide visual feedback to user interactions.
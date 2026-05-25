/** User-facing copy for prediction / payment flows (audit §3.3). */
export const TRADE_COPY = {
  // Calculation breakdown labels
  amount: "Amount",
  fee: "Fee",
  totalCost: "Total Cost",
  estimatedReturn: "Estimated Return",
  netResult: "Net Result",
  lossIfIncorrect: "Loss if Incorrect",

  // Primary action (replaces "Trade")
  placePrediction: "Place prediction",
  placingPrediction: "Placing prediction…",

  // Send Pi flow (replaces "Deposit")
  sendPiMemo: "Send Pi to Pi Predict",
  sendPiSuccessTitle: "Send Pi Successful",
  sendPiFailedTitle: "Send Pi Failed",
  sendPiFailedCancelled: "The payment was cancelled or failed. Please try again.",
  sendPiFailedConfirmation: (amount: number) =>
    `Could not complete ${amount} π payment confirmation.`,
  sendPiFailedError: "An error occurred while sending Pi. Please try again.",
  sendPiSuccessDescription: (amount: number) =>
    `Successfully sent ${amount} π from your wallet.`,

  // Profile / positions (replaces "Profit/Loss")
  netResultLabel: "Net Result",

  // Stats labels (replaces user-facing "Trades")
  predictionsCount: "Predictions",
  predictionsToday: (count: string) => `${count} predictions today`,
  predictions24h: "24h Predictions",
} as const;

/** Breakdown field labels — alias for calculation UI imports. */
export const TRADE_TERMS = {
  amount: TRADE_COPY.amount,
  fee: TRADE_COPY.fee,
  totalCost: TRADE_COPY.totalCost,
  estimatedReturn: TRADE_COPY.estimatedReturn,
  netResult: TRADE_COPY.netResult,
  lossIfIncorrect: TRADE_COPY.lossIfIncorrect,
} as const;

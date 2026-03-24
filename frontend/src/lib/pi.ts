import { toast } from "@/hooks/use-toast";

// apps/web/src/lib/pi.ts
export type PiSDK = {
  authenticate: (scopes: string[], onIncomplete: (payment: any) => void) => Promise<any>;
  createPayment: (paymentData: any, callbacks: {
    onReadyForServerApproval(paymentId: string): void;
    onReadyForServerCompletion(paymentId: string, txid: string): void;
    onCancel(paymentId: string): void;
    onError(error: Error, payment?: any): void;
  }) => Promise<any>;
};

declare global {
  interface Window { Pi?: PiSDK; }
}

export interface PaymentDTO {
  amount: number,
  user_uid: string,
  created_at: string,
  identifier: string,
  metadata: Object,
  memo: string,
  status: {
    developer_approved: boolean,
    transaction_verified: boolean,
    developer_completed: boolean,
    cancelled: boolean,
    user_cancelled: boolean,
  },
  to_address: string,
  transaction: null | {
    txid: string,
    verified: boolean,
    _link: string,
  },
};

function createMockPiSDK(): PiSDK {
  console.log("Using Mock Pi SDK for development.");
  return {
    authenticate: async (scopes, onIncomplete) => {
      console.log("Mock authenticate called with scopes:", scopes);
      return Promise.resolve({ user: { uid: 'mock-user-id', username: 'mock-user' } });
    },
    createPayment: async (paymentData, callbacks) => {
      console.log("Mock createPayment called with data:", paymentData);
      // Simulate a successful payment flow for development
      try {
        // A short delay to simulate user interaction
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockPaymentId = `mock_payment_${Date.now()}`;
        const mockTxid = `mock_tx_${Date.now()}`;

        console.log(`Mock: Calling onReadyForServerApproval with Payment ID: ${mockPaymentId}`);
        callbacks.onReadyForServerApproval(mockPaymentId);

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log(`Mock: Calling onReadyForServerCompletion with TXID: ${mockTxid}`);
        callbacks.onReadyForServerCompletion(mockPaymentId, mockTxid);

      } catch (error: any) {
        callbacks.onError(error);
      }
    },
  };
}


export function getPi(): PiSDK {
  if (typeof window === 'undefined') {
    // Return a server-side-safe mock or throw an error if this is unexpected.
    // For this app, getPi should only be called on the client.
    throw new Error("getPi cannot be called on the server.");
  }

  if (!window.Pi) {
    // If the real Pi SDK is not available, return the mock version.
    return createMockPiSDK();
  }

  return window.Pi!;
}

export async function initPiSDK() {
  if (typeof window === 'undefined') return;
  try {
    console.log("Initializing Pi SDK...");
    // This will attempt to init the real SDK if it exists.
    // In dev, window.Pi will be undefined, and this will be skipped.
    const Pi = window.Pi;
    if (Pi) {
      // @ts-ignore
      // Pi.init({ version: "2.0", sandbox: true, onUnsupported: () => console.log("Pi Browser not supported.") });
      Pi.init({ version: "2.0", onUnsupported: () => console.log("Pi Browser not supported.") });
      // console.log("Pi SDK initialized");
      // toast({
      //   title: "Pi SDK initialized",
      //   description: "The Pi SDK was successfully initialized.",
      //   variant: "success",
      //   duration: 3000
      // });
      
    } else {
      console.log("Real Pi SDK not found. Development mock will be used on demand.");
    }
  } catch (e: any) {
    console.warn("Could not initialize Pi SDK", e.message);
  }
}

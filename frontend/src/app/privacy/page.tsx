
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-[1400px] mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>This Privacy Policy describes how PredictPix ("we", "us", or "our") collects, uses, and discloses your information when you use our Service.
          </p>

          <h2 className="text-xl font-headline text-foreground pt-4">1. Information We Collect</h2>
          <p>
            <strong>Pi Network Information:</strong> When you authenticate with the Pi Browser, we receive your Pi username and a unique user ID. We do not receive access to your wallet's private keys. All transactions are initiated by you and require your explicit approval within the Pi Browser.
          </p>
          <p>
            <strong>Usage Information:</strong> We may collect information about your interactions with our Service, such as the markets you view, the predictions you make, and your activity on the platform. This helps us improve the Service and identify potential issues.
          </p>
           <p>
            <strong>Device and Connection Information:</strong> To maintain security and prevent fraud, we may collect information such as your IP address and browser user agent when you perform sensitive actions like placing a trade.
          </p>

          <h2 className="text-xl font-headline text-foreground pt-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Provide, operate, and maintain our Service.</li>
            <li>Process your transactions and manage your account.</li>
            <li>Communicate with you about your account or our Service.</li>
            <li>Monitor and analyze usage to improve the user experience.</li>
            <li>Detect and prevent fraudulent or prohibited activity.</li>
          </ul>

          <h2 className="text-xl font-headline text-foreground pt-4">3. Information Sharing</h2>
          <p>We do not sell your personal information. Your Pi username will be publicly associated with your market activity, such as comments or large trades, as is common in blockchain applications. We may share information with third-party service providers for fraud detection or analytics, but only as necessary to provide the Service.</p>
          
          <h2 className="text-xl font-headline text-foreground pt-4">4. Data Security</h2>
          <p>We implement security measures to protect your information. All sensitive backend communication is handled through secure functions, and we do not store private keys or other highly sensitive personal data.</p>

          <h2 className="text-xl font-headline text-foreground pt-4">5. Your Rights</h2>
          <p>As our system is built on a public ledger, transaction data (predictions, amounts) is inherently public. You may request deletion of your account-specific data (like profile information not on the blockchain) by contacting our support.</p>
          
          <h2 className="text-xl font-headline text-foreground pt-4">6. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

        </CardContent>
      </Card>
    </div>
  );
}

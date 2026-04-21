
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-[1400px] mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
            <p>Welcome to PredictPix. These Terms of Service ("Terms") govern your access to and use of the PredictPix website, services, and applications (collectively, the "Service"). Please read these Terms carefully.</p>

            <h2 className="text-xl font-headline text-foreground pt-4">1. Acceptance of Terms</h2>
            <p>By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use the Service.</p>

            <h2 className="text-xl font-headline text-foreground pt-4">2. Eligibility</h2>
            <p>You must be at least the age of majority as defined by the laws of your country of residence to use the Service. By using the Service, you represent and warrant that you meet this requirement.</p>

            <h2 className="text-xl font-headline text-foreground pt-4">3. The Service</h2>
            <p>PredictPix is a prediction market platform that allows users to place predictions on the outcomes of future events using the Pi cryptocurrency. We are not a financial institution, and the Service is for entertainment and informational purposes only.</p>

            <h2 className="text-xl font-headline text-foreground pt-4">4. User Conduct</h2>
            <p>You agree not to engage in any of the following prohibited activities: (a) attempting to manipulate any market; (b) using the service for any illegal purpose; (c) providing false or misleading information; (d) using automated scripts or bots to access the service, except where explicitly permitted.</p>

            <h2 className="text-xl font-headline text-foreground pt-4">5. Disclaimer of Warranties</h2>
            <p>The Service is provided on an "as is" and "as available" basis. PredictPix makes no warranties, express or implied, regarding the Service, including but not limited to the accuracy of market information or outcomes.</p>

            <h2 className="text-xl font-headline text-foreground pt-4">6. Limitation of Liability</h2>
            <p>In no event shall PredictPix, its directors, employees, or partners be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or other intangibles, arising out of or in connection with your use of the Service.</p>

            <h2 className="text-xl font-headline text-foreground pt-4">7. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will provide notice of any material changes. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.</p>
        </CardContent>
      </Card>
    </div>
  );
}

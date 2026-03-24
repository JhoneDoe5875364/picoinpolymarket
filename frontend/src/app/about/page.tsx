
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiPredictLogo } from "@/components/icons";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
            <PiPredictLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold font-headline mt-4">About PredictPix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p className="text-lg text-center">
            PredictPix is a decentralized, Pi-powered prediction market designed to harness the wisdom of the crowd. We provide a platform where users can forecast the outcomes of future events, from technology and finance to global news and entertainment, using only Pi cryptocurrency.
          </p>
          <div className="space-y-4">
            <h2 className="text-2xl font-headline text-foreground">Our Mission</h2>
            <p>
              Our mission is to create a fair, transparent, and accessible forecasting environment. By leveraging the security and reach of the Pi Network, we aim to empower individuals to speculate on real-world events, share their insights, and be rewarded for their foresight. We believe that prediction markets are a powerful tool for aggregating information and understanding future possibilities.
            </p>
            <h2 className="text-2xl font-headline text-foreground">How It Works</h2>
            <p>
              1. <strong>Browse Markets:</strong> Explore a wide range of questions about upcoming events.
            </p>
            <p>
              2. <strong>Place Predictions:</strong> Use your Pi to buy shares in the outcome you believe will occur. The price of a share reflects the market's collective belief in that outcome's probability.
            </p>
            <p>
              3. <strong>Track & Trade:</strong> Watch the market odds change as new information becomes available. You can hold your position until resolution or trade your shares on our secondary market.
            </p>
            <p>
              4. <strong>Resolution & Payout:</strong> When the event's outcome is determined, markets are resolved. If you predicted correctly, your shares are redeemed for their full value.
            </p>
            <h2 className="text-2xl font-headline text-foreground">The Pi Advantage</h2>
            <p>
              By building exclusively on the Pi Network, we ensure that PredictPix is part of a growing, user-centric ecosystem. This allows for low-cost transactions and a seamless experience for millions of Pioneers worldwide, directly within the Pi Browser.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqItems = [
  {
    question: "How do I start using PredictPix?",
    answer:
      "Open PredictPix in the Pi Browser, sign in with your Pi account, then explore active markets. Select an outcome, enter your amount, and confirm the trade.",
  },
  {
    question: "How are market probabilities determined?",
    answer:
      "Prices move based on live buy and sell activity. A higher price generally indicates that the market believes that outcome is more likely.",
  },
  {
    question: "Can I close a position before a market resolves?",
    answer:
      "Yes. If liquidity is available, you can trade your position on the market before final resolution instead of waiting until the event is settled.",
  },
  {
    question: "When do payouts happen?",
    answer:
      "After a market is resolved with a verified outcome, winning shares are redeemed according to the market rules shown on the market page.",
  },
  {
    question: "What should I do if a transaction fails?",
    answer:
      "First check your Pi Browser connection and wallet confirmation status. If the issue persists, contact support with your Pi username and the market ID.",
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-[1400px] mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-headline text-center">Help Center</CardTitle>
          <p className="text-muted-foreground text-sm">
            Get quick answers about using PredictPix, trading markets, and account support.
          </p>
        </CardHeader>
        <CardContent className="space-y-8 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-headline text-foreground">Getting Started</h2>
            <p className="text-sm">
              PredictPix is a Pi-powered prediction market. You place predictions on future events,
              monitor live odds, and receive payouts when your selected outcome wins.
            </p>
            <p className="text-sm">
              New to the platform? Visit the <Link href="/about" className="text-primary hover:underline">About page</Link> for a product overview,
              then review the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-headline text-foreground">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.question} className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">{item.question}</h3>
                  <p className="text-sm">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-headline text-foreground">Need More Help?</h2>
            <p className="text-sm">
              If you need account or transaction support, email{" "}
              <a className="text-primary hover:underline" href="mailto:support@predictpix.com">
                support@predictpix.com
              </a>{" "}
              and include:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Your Pi username</li>
              <li>The relevant market title or market ID</li>
              <li>A short description of the issue and what you already tried</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

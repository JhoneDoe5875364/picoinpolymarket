import Link from "next/link";

export function AppFooter() {
    return (
        <footer className="mt-auto border-t">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground space-y-4">
                 <div className="flex justify-center gap-4 text-sm">
                    <Link href="/about" className="hover:text-primary">About</Link>
                    <Link href="/help" className="hover:text-primary">Help Center</Link>
                    <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
                    <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
                    <a href="mailto:support@predictpix.com" className="hover:text-primary">Contact Support</a>
                </div>
                <p>
                    <span className="font-bold">Disclaimer:</span> PredictPix is a forecasting platform using Pi Network only. It is intended for entertainment and informational purposes and should not be considered financial advice or a financial services platform. All trades are final and outcomes are based on public information.
                </p>
            </div>
        </footer>
    );
}

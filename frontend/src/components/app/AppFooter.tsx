import Link from "next/link";

export function AppFooter() {
    return (
        <footer className="mt-auto border-t">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
                <div className="flex items-start gap-12 text-left sm:flex-col sm:items-center sm:gap-0 sm:space-y-4 sm:text-center">
                    <nav className="flex shrink-0 flex-col gap-2 text-sm sm:flex-row sm:justify-center sm:gap-4">
                        <Link href="/about" className="hover:text-primary whitespace-nowrap sm:whitespace-normal">About</Link>
                        <Link href="/help" className="hover:text-primary whitespace-nowrap sm:whitespace-normal">Help Center</Link>
                        <Link href="/terms" className="hover:text-primary whitespace-nowrap sm:whitespace-normal">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-primary whitespace-nowrap sm:whitespace-normal">Privacy Policy</Link>
                        <a href="mailto:support@predictpix.com" className="hover:text-primary whitespace-nowrap sm:whitespace-normal">Contact Support</a>
                    </nav>
                    <p className="min-w-0 flex-1 sm:flex-none">
                        <span className="font-bold">Disclaimer:</span> PredictPix is a forecasting platform using Pi Network only. It is intended for entertainment and informational purposes and should not be considered financial advice or a financial services platform. All trades are final and outcomes are based on public information.
                    </p>
                </div>
            </div>
        </footer>
    );
}

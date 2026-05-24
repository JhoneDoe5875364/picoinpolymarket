import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { AppShell } from "@/components/app/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { GeoControlProvider } from "@/context/GeoControlContext";
// removed AppFooter import

export const metadata: Metadata = {
  title: "PredictPix",
  description: "A Pi-only prediction market.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var savedTheme = localStorage.getItem('theme');
              var useDark = savedTheme ? savedTheme === 'dark' : true;
              document.documentElement.classList.toggle('dark', useDark);
            } catch (_) {}
          `}
        </Script>

        {/* <script>
          {`Pi.init({ version: "2.0", sandbox: true });`}
        </script> */}

        <Script id="strip-vsc-domain" strategy="beforeInteractive">
          {`
            try {
              var el = document.documentElement;
              if (el?.style?.getPropertyValue('--vsc-domain')) {
                el.style.removeProperty('--vsc-domain');
              }
              var style = el.getAttribute('style');
              if (style && style.includes('--vsc-domain')) {
                el.setAttribute('style', style.split(';').filter(s => s.trim() && !s.includes('--vsc-domain')).join(';'));
              }
            } catch (_) {}
          `}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;700&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <GeoControlProvider>
          <AuthProvider>
            <WatchlistProvider>
              <AppShell>
                <main className="flex-grow">{children}</main>
              </AppShell>
            </WatchlistProvider>
          </AuthProvider>
        </GeoControlProvider>
        <Toaster />
      </body>
    </html>
  );
}

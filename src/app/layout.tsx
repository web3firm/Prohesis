import "./globals.css";
import ThemeProvider from "@/context/ThemeProvider";
import { Web3Provider } from "@/context/Web3Provider";
import AuthProvider from "@/context/AuthProvider";
import { ToasterProvider } from "@/components/ui/Toaster";
import FooterGate from "@/components/ui/FooterGate";
import Navbar from "@/components/ui/Navbar";
import UsernameGate from "@/components/ui/UsernameGate";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: {
    default: "Prohesis",
    template: "%s · Prohesis",
  },
  description: "Web3 Prediction Market Platform",
  openGraph: {
    title: "Prohesis",
    description: "Web3 Prediction Market Platform",
    url: "/",
    siteName: "Prohesis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@prohesis",
    creator: "@prohesis",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-gradient-to-b from-white to-blue-50 text-gray-900 antialiased">
        <ToasterProvider>
          <ThemeProvider>
            <Web3Provider>
              <AuthProvider>

              <div className="flex flex-col min-h-screen">

                {/* ✅ Navbar at top */}
                <Navbar />

                {/* ✅ main expands to fill remaining height */}
                <main className="flex-grow">{children}<UsernameGate /></main>

                {/* ✅ Footer sticks to bottom */}
                <FooterGate />
                </div>

              </AuthProvider>
            </Web3Provider>
          </ThemeProvider>
        </ToasterProvider>
      </body>
    </html>
  );
}

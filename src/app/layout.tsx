import "./globals.css";
import ThemeProvider from "@/context/ThemeProvider";
import { Web3Provider } from "@/context/Web3Provider";
import AuthProvider from "@/context/AuthProvider";
import { ToasterProvider } from "@/components/ui/Toaster";
import ClientLayout from "@/components/layout/ClientLayout";
import Navbar from "@/components/layout/Navbar";

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
      <body
        className="
          flex flex-col min-h-screen
          bg-background-light text-foreground-light
          dark:bg-background-dark dark:text-foreground-dark
          transition-colors duration-300 antialiased
        "
      >
        <ThemeProvider>
          <ToasterProvider>
            <Web3Provider>
              <AuthProvider>
                <Navbar />
                <ClientLayout>{children}</ClientLayout>
              </AuthProvider>
            </Web3Provider>
          </ToasterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

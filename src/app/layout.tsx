import "./globals.css";
import  ThemeProvider  from "@/context/ThemeProvider";
import  {Web3Provider}  from "@/context/Web3Provider";
import  AuthProvider  from "@/context/AuthProvider";
import { ToasterProvider } from "@/components/ui/Toaster";

export const metadata = {
  title: "Prohesis",
  description: "Web3 Prediction Market Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gradient-to-b from-white to-blue-50 text-gray-900 antialiased">
       <ToasterProvider>
        <ThemeProvider>
          <Web3Provider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Web3Provider>
        </ThemeProvider>
        </ToasterProvider>
      </body>
    </html>
  );
}

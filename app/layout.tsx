import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CareLog — Family Care Coordination",
    template: "%s | CareLog",
  },
  description: "Centralized hub for families managing care for an aging parent",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "CareLog — Family Care Coordination",
    description: "Centralized hub for families managing care for an aging parent",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}

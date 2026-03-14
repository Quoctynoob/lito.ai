import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AmplifyProvider from "@/components/shared/amplify-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "lito",
  description: "lito.ai :)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}
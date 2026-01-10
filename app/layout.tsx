import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminProvider } from "@/components/AdminProvider";
import { SplitScreenProvider } from "@/components/SplitScreenProvider";
import { SplitScreenLayout } from "@/components/SplitScreenLayout";
import { UserProvider } from "@/components/UserProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MissionCS - Professional Procrastination",
  description: "Where study resources come to be perfectly organized (and occasionally studied)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased min-h-screen`}>
        <UserProvider>
          <AdminProvider>
            <SplitScreenProvider>
              <SplitScreenLayout>
                {children}
              </SplitScreenLayout>
            </SplitScreenProvider>
          </AdminProvider>
        </UserProvider>
      </body>
    </html>
  );
}

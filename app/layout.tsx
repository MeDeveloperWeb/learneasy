import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminProvider } from "@/components/AdminProvider";
import { SplitScreenProvider } from "@/components/SplitScreenProvider";
import { SplitScreenLayout } from "@/components/SplitScreenLayout";
import { UserProvider } from "@/components/UserProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavProvider } from "@/components/NavProvider";
import { BottomBar } from "@/components/BottomBar";

// Runs before paint to set the theme class on <html>, avoiding a light flash.
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen`}>
        <ThemeProvider>
          <UserProvider>
            <AdminProvider>
              <SplitScreenProvider>
                <NavProvider>
                  <SplitScreenLayout>
                    {children}
                  </SplitScreenLayout>
                  <BottomBar />
                </NavProvider>
              </SplitScreenProvider>
            </AdminProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";
import "katex/dist/katex.min.css";
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
  // Resolves all relative URLs in metadata (canonical, OG images) to absolute.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Free Study Notes, Resources & Past Papers`,
    // Page titles become "Topic Name — Paper | LearnEasy".
    template: `%s | ${SITE_NAME}`,
  },
  description:
    `${SITE_NAME} is a free, community-curated study hub: notes, video lectures, ` +
    `PDFs and past papers organized by subject, unit and topic. Find resources ` +
    `for any topic in seconds.`,
  applicationName: SITE_NAME,
  keywords: [
    "study notes", "study resources", "past papers", "lecture notes",
    "video lectures", "exam preparation", "free study material", SITE_NAME,
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free Study Notes, Resources & Past Papers`,
    description:
      `Free, community-curated study notes, resources and past papers organized ` +
      `by subject, unit and topic.`,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Free Study Notes & Resources`,
    description:
      `Free, community-curated study notes, resources and past papers organized ` +
      `by subject, unit and topic.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
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

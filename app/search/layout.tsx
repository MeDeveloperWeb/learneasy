import type { Metadata } from 'next';

// The /search page is a client-only Google Custom Search widget — thin, JS-only
// content with no value in Google's index. Keep it out (but let links be
// followed). A server layout is the only place a client page can declare this.
export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}

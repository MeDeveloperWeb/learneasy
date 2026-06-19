import { Header } from '@/components/Header';
import { AddPaperForm } from '@/components/AddPaperForm';
import { JsonLd } from '@/components/JsonLd';
import { PaperGrid } from '@/components/PaperGrid';
import { getPapers } from '@/lib/queries';
import { SITE_NAME, SITE_URL, absoluteUrl, paperPath } from '@/lib/seo';

// No searchParams / dynamic APIs => prerendered static, fully prefetched on the
// Home link (no loading flash). Weekly ISR backstop; real updates ride the
// 'papers' tag (bustPapers on paper create). Keep in sync with REVALIDATE.
export const revalidate = 604800; // 1 week
export const metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const papers = await getPapers();

  // Structured data: the site (with a sitelinks search box) + the paper list.
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: papers.map((paper, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: paper.title,
        url: absoluteUrl(paperPath(paper.id, paper.title)),
      })),
    },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-20">
      <JsonLd data={jsonLd} />
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            <span className="gradient-text">Organize Now, Study Later™</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            All your resources in one place. Perfectly categorized. Beautifully organized. Ready whenever you are.
          </p>
        </div>

        <AddPaperForm />

        <PaperGrid papers={papers} />
      </main>
    </div>
  );
}

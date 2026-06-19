import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { AddTopicButton } from '@/components/AddTopicButton';
import { UnitSection } from '@/components/UnitSection';
import { JsonLd } from '@/components/JsonLd';
import { getPaper } from '@/lib/queries';
import { SITE_NAME, absoluteUrl, slugify, paperPath, topicPath } from '@/lib/seo';

// Prerender every paper at build, ISR-refresh as a fallback, and render any
// not-yet-built id on demand (then cache it). Real updates ride on-demand tags.
// (Segment config must be a literal; keep in sync with REVALIDATE in lib/cache-tags.)
export const revalidate = 604800; // 1 week (lazy backstop; updates ride on-demand tags)
export const dynamicParams = true;

type RouteParams = { id: string; slug: string };

export async function generateStaticParams() {
    try {
        const papers = await prisma.paper.findMany({ select: { id: true, title: true } });
        return papers.map((p) => ({ id: p.id, slug: slugify(p.title) }));
    } catch {
        return [];
    }
}

export async function generateMetadata(
    { params }: { params: Promise<RouteParams> },
): Promise<Metadata> {
    const { id } = await params;
    const paper = await getPaper(id);

    if (!paper) {
        return { title: 'Paper not found', robots: { index: false, follow: false } };
    }

    const canonicalUrl = absoluteUrl(paperPath(id, paper.title));
    const topicNames = paper.units
        .flatMap((u) => u.topics.map((t) => t.title))
        .slice(0, 8);
    const codePart = paper.code ? ` (${paper.code})` : '';
    const title = `${paper.title}${codePart}`;
    const description =
        `${paper.title}${codePart}: ${paper.units.length} units` +
        (topicNames.length
            ? ` covering ${topicNames.join(', ')}.`
            : '.') +
        ` Free study notes, video lectures, PDFs and curated resources on ${SITE_NAME}.`;

    return {
        title,
        description,
        keywords: [paper.title, paper.code, ...topicNames, 'notes', 'study material']
            .filter(Boolean) as string[],
        alternates: {
            canonical: canonicalUrl,
            // Markdown twin for AI/LLM agents (served via middleware -> /api/md).
            types: { 'text/markdown': `${canonicalUrl}.md` },
        },
        openGraph: {
            type: 'website',
            url: canonicalUrl,
            title: `${title} | ${SITE_NAME}`,
            description,
            siteName: SITE_NAME,
        },
        twitter: { card: 'summary', title, description },
    };
}

export default async function PaperPage({ params }: { params: Promise<RouteParams> }) {
    const { id, slug } = await params;

    const paper = await getPaper(id);

    if (!paper) {
        notFound();
    }

    // id is the key; slug is cosmetic. Stale/typo'd slug → 308 to canonical.
    const canonicalSlug = slugify(paper.title);
    if (slug !== canonicalSlug) {
        permanentRedirect(paperPath(id, paper.title));
    }

    const canonicalUrl = absoluteUrl(paperPath(id, paper.title));

    // Structured data: breadcrumb + the paper as a Course with its topics listed.
    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
                { '@type': 'ListItem', position: 2, name: paper.title, item: canonicalUrl },
            ],
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: paper.title,
            ...(paper.code ? { courseCode: paper.code } : {}),
            url: canonicalUrl,
            description:
                `Study notes, video lectures, PDFs and curated resources for ${paper.title}.`,
            provider: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
            hasPart: paper.units.flatMap((u) =>
                u.topics.map((t) => ({
                    '@type': 'LearningResource',
                    name: t.title,
                    url: absoluteUrl(topicPath(t.id, t.title)),
                }))
            ),
        },
    ];

    return (
        <div className="min-h-screen pb-24 md:pb-20 relative">
            <JsonLd data={jsonLd} />
            <Header />

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm mb-8 animate-fade-in">
                    <Link
                        href="/"
                        className="text-gray-400 hover:text-purple-500 transition-colors flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Papers
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-600 font-medium">{paper.title}</span>
                </nav>

                {/* Paper Header Card */}
                <div className="bg-white rounded-2xl p-8 mb-10 shadow-sm border border-gray-100
                               animate-slide-up" style={{ opacity: 0 }}>
                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-teal-400
                                       flex items-center justify-center text-white font-bold text-2xl
                                       shadow-lg shadow-purple-500/20">
                            {paper.title.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {paper.title}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                {paper.code && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                        {paper.code}
                                    </span>
                                )}
                                {paper.credit && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {paper.credit} Credits
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    {paper.units.length} Units
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Units */}
                <div className="space-y-6">
                    {paper.units.map((unit, unitIndex) => (
                        <UnitSection key={unit.id} unit={unit} unitIndex={unitIndex} />
                    ))}
                </div>

                {paper.units.length === 0 && (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl
                                   border-2 border-dashed border-gray-200 animate-fade-in">
                        <div className="text-5xl mb-4">📖</div>
                        <p className="font-medium">No units found</p>
                        <p className="text-sm mt-1">Units will appear here once added.</p>
                    </div>
                )}

                {/* Floating button for custom unit only */}
                {paper.units.find(u => u.isCustom) && (
                    <AddTopicButton
                        unitId={paper.units.find(u => u.isCustom)!.id}
                        isCustom={true}
                    />
                )}
            </main>
        </div>
    );
}

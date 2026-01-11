import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { AddTopicButton } from '@/components/AddTopicButton';
import { UnitSection } from '@/components/UnitSection';

export const dynamic = 'force-dynamic';

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const paper = await prisma.paper.findUnique({
        where: { id },
        include: {
            units: {
                orderBy: { createdAt: 'asc' },
                include: {
                    topics: {
                        orderBy: { order: 'asc' },
                        include: { _count: { select: { resources: true } } }
                    }
                }
            }
        }
    });

    if (!paper) {
        notFound();
    }

    return (
        <div className="min-h-screen pb-20 relative">
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

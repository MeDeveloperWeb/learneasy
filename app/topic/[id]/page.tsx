import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { AddResourceButton } from '@/components/AddResourceButton';
import { ResourceCard } from '@/components/ResourceCard';

export const dynamic = 'force-dynamic';

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const topic = await prisma.topic.findUnique({
        where: { id },
        include: {
            unit: {
                include: { paper: true }
            }
        }
    });

    if (!topic) {
        notFound();
    }

    const resources = await prisma.resource.findMany({
        where: { topicId: id },
        orderBy: [
            { likesCount: 'desc' },
            { createdAt: 'desc' },
        ],
        include: {
            likes: {
                select: { userId: true },
            },
        },
    });

    return (
        <div className="min-h-screen pb-20 relative">
            <Header />

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm mb-8 flex-wrap animate-fade-in">
                    <Link
                        href="/"
                        className="text-gray-400 hover:text-purple-500 transition-colors flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </Link>
                    <span className="text-gray-300">/</span>
                    <Link
                        href={`/paper/${topic.unit.paper.id}`}
                        className="text-gray-400 hover:text-purple-500 transition-colors"
                    >
                        {topic.unit.paper.title}
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-500">{topic.unit.title}</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-600 font-medium">{topic.title}</span>
                </nav>

                {/* Topic Header */}
                <div className="mb-10 animate-slide-up" style={{ opacity: 0 }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-teal-400" />
                        <span className="text-sm text-gray-400 font-medium">{topic.unit.title}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 flex-1">
                            {topic.title}
                        </h1>
                        <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(topic.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200
                                     rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all
                                     text-gray-700 hover:text-purple-700 font-medium text-sm group
                                     shadow-sm hover:shadow-md"
                            title="Search on Google"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                            </svg>
                            <span className="hidden sm:inline">Search on Google</span>
                            <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                    <p className="text-gray-500 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Community curated resources
                    </p>
                </div>

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {resources.map((resource, index) => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            index={index}
                        />
                    ))}
                </div>

                {resources.length === 0 && (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl 
                                   border-2 border-dashed border-gray-200 animate-fade-in">
                        <div className="text-5xl mb-4">🔗</div>
                        <p className="font-medium">No resources yet</p>
                        <p className="text-sm mt-1">Be the first to add a helpful resource!</p>
                    </div>
                )}

                <AddResourceButton topicId={topic.id} />
            </main>
        </div>
    );
}

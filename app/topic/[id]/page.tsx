import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { AddResourceButton } from '@/components/AddResourceButton';
import { ResourceCard } from '@/components/ResourceCard';
import { TopicSearchButtons } from '@/components/TopicSearchButtons';
import { TopicProvider } from '@/components/TopicProvider';

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

    // Extract resource URLs for split screen context
    const resourceUrls = resources
        .filter(r => r.url) // Only LINK resources
        .map(r => r.url!);

    return (
        <TopicProvider topicId={id} resourceUrls={resourceUrls}>
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

                    {/* Search buttons - show on top on mobile, on the right on desktop */}
                    <div className="mb-4 lg:hidden">
                        <TopicSearchButtons topicTitle={topic.title} />
                    </div>

                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 flex-1">
                            {topic.title}
                        </h1>
                        <div className="hidden lg:block">
                            <TopicSearchButtons topicTitle={topic.title} />
                        </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </TopicProvider>
    );
}

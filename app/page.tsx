import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { AddPaperForm } from '@/components/AddPaperForm';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const papers = await prisma.paper.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { units: true } } }
  });

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            <span className="gradient-text">Master Your Exams</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Community-curated resources to help you prepare. Select a paper below to get started.
          </p>
        </div>

        <AddPaperForm />

        {/* Paper Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper, index) => (
            <Link
              key={paper.id}
              href={`/paper/${paper.id}`}
              className={`group block p-6 bg-white rounded-2xl shadow-sm 
                         gradient-border card-hover animate-slide-up
                         stagger-${Math.min(index + 1, 6)}`}
              style={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-teal-400 
                               flex items-center justify-center text-white font-bold text-lg
                               group-hover:scale-110 transition-transform">
                  {paper.title.charAt(0)}
                </div>
                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full">
                  {paper._count.units} Units
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 
                           transition-colors mb-2 line-clamp-2">
                {paper.title}
              </h2>

              <div className="flex items-center text-sm text-gray-400 group-hover:text-purple-400 transition-colors">
                <span>Explore topics</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}

          {papers.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400 bg-white rounded-2xl 
                           border-2 border-dashed border-gray-200 animate-fade-in">
              <div className="text-5xl mb-4">📚</div>
              <p className="font-medium">No papers yet</p>
              <p className="text-sm mt-1">Admin can add the first paper to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

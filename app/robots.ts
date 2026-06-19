import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Allow crawling of all content pages; keep API routes and the (thin, JS-only)
// Google CSE search page out of the index. Point crawlers at the sitemap.
//
// AI crawlers are explicitly welcomed: blocking the AI *search* bots (PerplexityBot,
// OAI-SearchBot, etc.) removes pages from AI answers within hours, so we opt in.
// All these vendors honor robots.txt. Keep this list in sync as new bots appear.
const AI_BOTS = [
  // OpenAI
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  // Anthropic (Claude)
  'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai',
  // Perplexity
  'PerplexityBot', 'Perplexity-User',
  // Google / Apple / Amazon / Meta AI
  'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'Meta-ExternalAgent',
  // Common Crawl (feeds many models), ByteDance, Cohere
  'CCBot', 'Bytespider', 'cohere-ai',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/search'] },
      { userAgent: AI_BOTS, allow: '/', disallow: ['/api/', '/search'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

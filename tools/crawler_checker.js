#!/usr/bin/env node
/**
 * AI Crawler Access Checker — Checks robots.txt for AI crawler access.
 * Also checks for llms.txt, meta robots tags, and JS rendering issues.
 *
 * Usage: node crawler_checker.js <domain>
 * Output: JSON with per-crawler access, tier scores, llms.txt assessment
 *
 * References:
 * - geo-seo-claude crawler analysis (github.com/zubair-trabzada/geo-seo-claude)
 * - Originality.ai 2025 study on AI crawler blocking
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// --- AI Crawler Reference ---
const AI_CRAWLERS = [
  // Tier 1: Critical for AI search visibility
  { name: 'GPTBot', operator: 'OpenAI', tier: 1, purpose: 'ChatGPT Search (300M+ users)' },
  { name: 'OAI-SearchBot', operator: 'OpenAI', tier: 1, purpose: 'ChatGPT search-only crawler (no training)' },
  { name: 'ChatGPT-User', operator: 'OpenAI', tier: 1, purpose: 'User-initiated ChatGPT browsing' },
  { name: 'ClaudeBot', operator: 'Anthropic', tier: 1, purpose: 'Claude web search and analysis' },
  { name: 'PerplexityBot', operator: 'Perplexity', tier: 1, purpose: 'Perplexity search (best referral traffic)' },
  // Tier 2: Important for broader AI ecosystem
  { name: 'Google-Extended', operator: 'Google', tier: 2, purpose: 'Gemini features (no search rank impact)' },
  { name: 'GoogleOther', operator: 'Google', tier: 2, purpose: 'Google AI research' },
  { name: 'Applebot-Extended', operator: 'Apple', tier: 2, purpose: 'Apple Intelligence (2B+ devices)' },
  { name: 'Amazonbot', operator: 'Amazon', tier: 2, purpose: 'Alexa and Amazon AI' },
  { name: 'FacebookBot', operator: 'Meta', tier: 2, purpose: 'Meta AI (3B+ app users)' },
  // Tier 3: Training-only crawlers
  { name: 'CCBot', operator: 'Common Crawl', tier: 3, purpose: 'Training data (many AI companies)' },
  { name: 'anthropic-ai', operator: 'Anthropic', tier: 3, purpose: 'Claude model training only' },
  { name: 'Bytespider', operator: 'ByteDance', tier: 3, purpose: 'TikTok AI / Doubao' },
  { name: 'cohere-ai', operator: 'Cohere', tier: 3, purpose: 'Cohere model training' },
];

// --- Fetch helper ---
function fetchUrl(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,text/plain,*/*',
      },
      timeout: timeoutMs,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(new URL(res.headers.location, url).href, timeoutMs));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString(), headers: res.headers }));
    });
    req.on('error', (e) => resolve({ status: 0, body: '', error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '', error: 'timeout' }); });
  });
}

// --- Parse robots.txt ---
function parseRobotsTxt(robotsTxt) {
  const rules = {}; // { 'user-agent': [{ type: 'allow'|'disallow', path: '...' }] }
  let currentAgents = [];

  for (const rawLine of robotsTxt.split('\n')) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;

    const [directive, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    if (directive.toLowerCase() === 'user-agent') {
      currentAgents = [value.toLowerCase()];
      if (!rules[value.toLowerCase()]) rules[value.toLowerCase()] = [];
    } else if (directive.toLowerCase() === 'disallow' && currentAgents.length > 0) {
      for (const agent of currentAgents) {
        if (!rules[agent]) rules[agent] = [];
        rules[agent].push({ type: 'disallow', path: value });
      }
    } else if (directive.toLowerCase() === 'allow' && currentAgents.length > 0) {
      for (const agent of currentAgents) {
        if (!rules[agent]) rules[agent] = [];
        rules[agent].push({ type: 'allow', path: value });
      }
    }
  }

  return rules;
}

function getCrawlerAccess(rules, crawlerName) {
  const name = crawlerName.toLowerCase();

  // Check specific user-agent rules first
  if (rules[name]) {
    const agentRules = rules[name];
    // Check for root disallow
    const hasRootDisallow = agentRules.some(r => r.type === 'disallow' && (r.path === '/' || r.path === ''));
    const hasRootAllow = agentRules.some(r => r.type === 'allow' && r.path === '/');

    if (hasRootAllow) return 'allowed';
    if (hasRootDisallow) return 'blocked';
    // Has specific rules but not a blanket block
    return 'partial';
  }

  // Fall back to wildcard rules
  if (rules['*']) {
    const wildcardRules = rules['*'];
    const hasRootDisallow = wildcardRules.some(r => r.type === 'disallow' && r.path === '/');
    if (hasRootDisallow) return 'blocked_by_wildcard';
    return 'allowed_by_default';
  }

  // No rules at all = allowed
  return 'allowed_by_default';
}

// --- Check for meta robots on a page ---
function checkMetaRobots(html) {
  const results = {
    noindex: false,
    nofollow: false,
    noai: false,
    noimageai: false,
    bot_specific: [],
  };

  // Standard meta robots
  const metaRegex = /<meta\s+name\s*=\s*["']robots["']\s+content\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const content = match[1].toLowerCase();
    if (content.includes('noindex')) results.noindex = true;
    if (content.includes('nofollow')) results.nofollow = true;
    if (content.includes('noai')) results.noai = true;
    if (content.includes('noimageai')) results.noimageai = true;
  }

  // Bot-specific meta tags
  for (const crawler of AI_CRAWLERS) {
    const botRegex = new RegExp(`<meta\\s+name\\s*=\\s*["']${crawler.name}["']\\s+content\\s*=\\s*["']([^"']+)["']`, 'gi');
    const botMatch = botRegex.exec(html);
    if (botMatch) {
      results.bot_specific.push({ crawler: crawler.name, content: botMatch[1] });
    }
  }

  return results;
}

// --- Check if page requires JavaScript ---
function checkJsRendering(html) {
  const signals = {
    likely_spa: false,
    has_noscript: false,
    react_app: false,
    vue_app: false,
    angular_app: false,
    minimal_content: false,
  };

  // Check for SPA frameworks
  if (/<div\s+id\s*=\s*["'](?:root|app|__next)["']\s*>/i.test(html)) signals.likely_spa = true;
  if (/<noscript/i.test(html)) signals.has_noscript = true;
  if (/react/i.test(html) || /__NEXT_DATA__/.test(html)) signals.react_app = true;
  if (/vue/i.test(html) || /v-app/i.test(html)) signals.vue_app = true;
  if (/ng-app|angular/i.test(html)) signals.angular_app = true;

  // Check if there's minimal content in the body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyText = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').trim();
    if (bodyText.length < 500) signals.minimal_content = true;
  }

  return signals;
}

// --- Score calculation ---
function calculateScore(crawlerResults, llmsTxt, metaRobots) {
  let score = 0;

  // Tier 1 crawlers (50% weight) — 10 points each
  const tier1 = crawlerResults.filter(c => c.tier === 1);
  const tier1Allowed = tier1.filter(c => c.status === 'allowed' || c.status === 'allowed_by_default').length;
  score += (tier1Allowed / tier1.length) * 50;

  // Tier 2 crawlers (25% weight) — 5 points each
  const tier2 = crawlerResults.filter(c => c.tier === 2);
  const tier2Allowed = tier2.filter(c => c.status === 'allowed' || c.status === 'allowed_by_default').length;
  score += (tier2Allowed / tier2.length) * 25;

  // No blanket AI blocks (15%)
  const hasNoai = metaRobots && metaRobots.noai;
  const hasBlanketBlock = crawlerResults.some(c => c.tier === 1 && c.status === 'blocked_by_wildcard');
  if (!hasNoai && !hasBlanketBlock) score += 15;

  // AI-specific files (10%)
  if (llmsTxt.exists) score += 5;
  // Sitemap bonus handled elsewhere
  score += 5; // baseline for having robots.txt accessible

  return Math.round(Math.min(score, 100));
}

// --- Main ---
async function checkCrawlerAccess(domain) {
  // Normalize domain
  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const baseUrl = `https://${domain}`;

  // Fetch robots.txt
  const robotsResult = await fetchUrl(`${baseUrl}/robots.txt`);
  const robotsFound = robotsResult.status === 200;
  const rules = robotsFound ? parseRobotsTxt(robotsResult.body) : {};

  // Check each crawler
  const crawlerResults = AI_CRAWLERS.map(crawler => ({
    ...crawler,
    status: robotsFound ? getCrawlerAccess(rules, crawler.name) : 'allowed_by_default',
  }));

  // Check llms.txt
  const llmsResult = await fetchUrl(`${baseUrl}/llms.txt`);
  const llmsTxt = {
    exists: llmsResult.status === 200 && llmsResult.body.length > 10,
    status_code: llmsResult.status,
    content_length: llmsResult.body ? llmsResult.body.length : 0,
    preview: llmsResult.status === 200 ? llmsResult.body.substring(0, 500) : null,
  };

  // Check llms-full.txt
  const llmsFullResult = await fetchUrl(`${baseUrl}/llms-full.txt`);
  const llmsFullTxt = {
    exists: llmsFullResult.status === 200 && llmsFullResult.body.length > 10,
    status_code: llmsFullResult.status,
  };

  // Fetch homepage and check meta robots + JS rendering
  const homepageResult = await fetchUrl(baseUrl);
  let metaRobots = null;
  let jsRendering = null;
  if (homepageResult.status === 200) {
    metaRobots = checkMetaRobots(homepageResult.body);
    jsRendering = checkJsRendering(homepageResult.body);
  }

  // Check for sitemap
  const sitemapResult = await fetchUrl(`${baseUrl}/sitemap.xml`);
  const sitemapExists = sitemapResult.status === 200 && sitemapResult.body.includes('<urlset');

  // Calculate score
  const score = calculateScore(crawlerResults, llmsTxt, metaRobots);

  // Tier summaries
  const tier1 = crawlerResults.filter(c => c.tier === 1);
  const tier2 = crawlerResults.filter(c => c.tier === 2);
  const tier3 = crawlerResults.filter(c => c.tier === 3);

  return {
    domain,
    robots_txt_found: robotsFound,
    crawler_access_score: score,
    tier_summary: {
      tier1_allowed: tier1.filter(c => !c.status.includes('blocked')).length,
      tier1_total: tier1.length,
      tier2_allowed: tier2.filter(c => !c.status.includes('blocked')).length,
      tier2_total: tier2.length,
      tier3_allowed: tier3.filter(c => !c.status.includes('blocked')).length,
      tier3_total: tier3.length,
    },
    crawlers: crawlerResults,
    llms_txt: llmsTxt,
    llms_full_txt: llmsFullTxt,
    meta_robots: metaRobots,
    js_rendering: jsRendering,
    sitemap_exists: sitemapExists,
    robots_txt_raw: robotsFound ? robotsResult.body.substring(0, 2000) : null,
  };
}

// CLI entry point
const domain = process.argv[2];
if (!domain) {
  console.error('Usage: node crawler_checker.js <domain>');
  process.exit(1);
}

checkCrawlerAccess(domain)
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(err => {
    console.error(JSON.stringify({ error: err.message, domain }));
    process.exit(1);
  });

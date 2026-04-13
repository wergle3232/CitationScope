#!/usr/bin/env node
/**
 * Schema Markup Checker — Extracts and validates JSON-LD structured data.
 * Checks for GEO-critical schema types and scores completeness.
 *
 * Usage: node schema_checker.js <url>
 * Output: JSON with schema types found, validation, missing opportunities, score
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// --- GEO-critical schema types by page type ---
const SCHEMA_EXPECTATIONS = {
  local_business: {
    critical: ['LocalBusiness', 'Organization'],
    important: ['FAQPage', 'BreadcrumbList', 'WebSite'],
    recommended: ['HowTo', 'Article', 'Review', 'AggregateRating', 'Service', 'Product'],
    bonus: ['Event', 'Person', 'VideoObject', 'ImageObject'],
  },
  article: {
    critical: ['Article', 'Organization'],
    important: ['BreadcrumbList', 'FAQPage'],
    recommended: ['HowTo', 'Person', 'WebSite'],
    bonus: ['VideoObject', 'ImageObject', 'Review'],
  },
  homepage: {
    critical: ['Organization', 'WebSite'],
    important: ['BreadcrumbList', 'FAQPage'],
    recommended: ['LocalBusiness', 'Service', 'Product', 'AggregateRating'],
    bonus: ['Event', 'Person', 'VideoObject'],
  },
};

// Detect page type from URL and schema present
function detectPageType(url, foundTypes, html) {
  const path = new URL(url).pathname.toLowerCase();

  // Homepage
  if (path === '/' || path === '') return 'homepage';

  // Blog/article indicators
  if (path.includes('/posts/') || path.includes('/blog/') || path.includes('/stacknotes/') ||
      path.includes('/article') || path.includes('/news/')) return 'article';
  if (foundTypes.includes('Article') || foundTypes.includes('BlogPosting') || foundTypes.includes('NewsArticle')) return 'article';
  if (/<article\b/i.test(html) || /class\s*=\s*["'][^"']*(?:post-content|entry-content|article-body)/i.test(html)) return 'article';

  // Local business indicators
  if (foundTypes.some(t => t.includes('Business'))) return 'local_business';
  const hasAddress = /\d+\s+\w+\s+(?:Street|St|Road|Rd|Ave|Avenue|Blvd|Drive|Dr|Lane|Ln)\b/i.test(html);
  const hasPhone = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(html);
  if (hasAddress && hasPhone) return 'local_business';

  // Default to homepage expectations for service/product pages
  return 'homepage';
}

// --- Fetch helper ---
function fetchPage(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchPage(new URL(res.headers.location, url).href, redirectCount + 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// --- Extract JSON-LD blocks ---
function extractJsonLd(html) {
  const blocks = [];
  const regex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim());
      if (Array.isArray(data)) {
        blocks.push(...data);
      } else {
        blocks.push(data);
      }
    } catch (e) {
      blocks.push({ _parse_error: true, _raw: match[1].substring(0, 200), _error: e.message });
    }
  }

  // Also handle @graph
  const expanded = [];
  for (const block of blocks) {
    if (block['@graph'] && Array.isArray(block['@graph'])) {
      expanded.push(...block['@graph']);
    } else {
      expanded.push(block);
    }
  }

  return expanded;
}

// --- Extract microdata ---
function detectMicrodata(html) {
  const types = [];
  const regex = /itemtype\s*=\s*["']https?:\/\/schema\.org\/(\w+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    types.push(match[1]);
  }
  return [...new Set(types)];
}

// --- Classify schema types ---
function classifySchemas(jsonLdBlocks, microdataTypes) {
  const found = new Set();
  const details = [];

  for (const block of jsonLdBlocks) {
    if (block._parse_error) {
      details.push({ type: 'PARSE_ERROR', error: block._error, raw_preview: block._raw });
      continue;
    }

    const type = block['@type'];
    if (!type) continue;

    const types = Array.isArray(type) ? type : [type];
    for (const t of types) {
      found.add(t);
      details.push(analyzeSchemaBlock(t, block));
    }
  }

  for (const t of microdataTypes) {
    if (!found.has(t)) {
      found.add(t);
      details.push({ type: t, source: 'microdata', completeness: 'unknown' });
    }
  }

  return { found: [...found], details };
}

// --- Analyze individual schema block ---
function analyzeSchemaBlock(type, block) {
  const result = {
    type,
    source: 'json-ld',
    fields_present: [],
    fields_missing: [],
    completeness: 0,
    issues: [],
  };

  switch (type) {
    case 'LocalBusiness':
    case 'HomeAndConstructionBusiness':
    case 'GeneralContractor':
    case 'RoofingContractor':
    case 'Plumber':
    case 'Electrician':
    case 'HVACBusiness': {
      const required = ['name', 'address', 'telephone', 'url'];
      const recommended = ['description', 'image', 'geo', 'openingHoursSpecification',
        'areaServed', 'priceRange', 'sameAs', 'aggregateRating', 'review'];
      checkFields(block, required, recommended, result);
      // Check sameAs for entity recognition
      if (block.sameAs) {
        const sameAs = Array.isArray(block.sameAs) ? block.sameAs : [block.sameAs];
        result.sameAs_count = sameAs.length;
        result.sameAs_platforms = sameAs.map(url => {
          try { return new URL(url).hostname; } catch { return url; }
        });
      } else {
        result.issues.push('Missing sameAs — critical for AI entity recognition. Add links to social profiles, Google Business, BBB.');
      }
      break;
    }
    case 'Organization': {
      const required = ['name', 'url'];
      const recommended = ['description', 'logo', 'sameAs', 'contactPoint', 'address', 'foundingDate'];
      checkFields(block, required, recommended, result);
      if (!block.sameAs) {
        result.issues.push('Missing sameAs — add social profiles for AI entity recognition.');
      }
      break;
    }
    case 'WebSite': {
      const required = ['name', 'url'];
      const recommended = ['potentialAction', 'description'];
      checkFields(block, required, recommended, result);
      if (block.potentialAction) {
        result.has_search_action = true;
      }
      break;
    }
    case 'FAQPage': {
      if (block.mainEntity && Array.isArray(block.mainEntity)) {
        result.question_count = block.mainEntity.length;
        result.fields_present.push(`mainEntity (${block.mainEntity.length} questions)`);
        result.completeness = 100;
      } else {
        result.issues.push('FAQPage schema exists but mainEntity is missing or not an array.');
        result.completeness = 20;
      }
      break;
    }
    case 'Article':
    case 'BlogPosting':
    case 'NewsArticle': {
      const required = ['headline', 'author', 'datePublished'];
      const recommended = ['dateModified', 'image', 'publisher', 'description', 'mainEntityOfPage'];
      checkFields(block, required, recommended, result);
      // Check author quality
      if (block.author) {
        const author = Array.isArray(block.author) ? block.author[0] : block.author;
        if (typeof author === 'string') {
          result.issues.push('Author should be a Person object with name and url, not a plain string.');
        } else if (author['@type'] === 'Person' && !author.url) {
          result.issues.push('Author Person object missing url — add link to author bio page for E-E-A-T.');
        }
      }
      break;
    }
    case 'BreadcrumbList': {
      if (block.itemListElement && Array.isArray(block.itemListElement)) {
        result.breadcrumb_depth = block.itemListElement.length;
        result.fields_present.push(`itemListElement (${block.itemListElement.length} levels)`);
        result.completeness = 100;
      }
      break;
    }
    case 'HowTo': {
      const required = ['name', 'step'];
      const recommended = ['description', 'totalTime', 'estimatedCost', 'image'];
      checkFields(block, required, recommended, result);
      break;
    }
    case 'Product':
    case 'Service': {
      const required = ['name'];
      const recommended = ['description', 'image', 'offers', 'aggregateRating', 'review', 'brand'];
      checkFields(block, required, recommended, result);
      break;
    }
    default: {
      result.fields_present = Object.keys(block).filter(k => !k.startsWith('@'));
      result.completeness = result.fields_present.length > 3 ? 70 : 40;
    }
  }

  return result;
}

function checkFields(block, required, recommended, result) {
  let reqPresent = 0;
  let recPresent = 0;

  for (const field of required) {
    if (block[field] !== undefined && block[field] !== null && block[field] !== '') {
      result.fields_present.push(field);
      reqPresent++;
    } else {
      result.fields_missing.push(field);
    }
  }

  for (const field of recommended) {
    if (block[field] !== undefined && block[field] !== null && block[field] !== '') {
      result.fields_present.push(field);
      recPresent++;
    } else {
      result.fields_missing.push(field);
    }
  }

  const total = required.length + recommended.length;
  const present = reqPresent + recPresent;
  result.completeness = Math.round((present / total) * 100);

  // Flag missing required fields
  for (const field of required) {
    if (!result.fields_present.includes(field)) {
      result.issues.push(`Missing required field: ${field}`);
    }
  }
}

// --- Score calculation ---
function calculateSchemaScore(foundTypes, details, pageType) {
  let score = 0;
  const schemas = SCHEMA_EXPECTATIONS[pageType] || SCHEMA_EXPECTATIONS.homepage;

  // Critical schemas (40 points)
  for (const type of schemas.critical) {
    if (foundTypes.some(t => t === type || t.includes('Business') || t === 'Organization')) {
      const detail = details.find(d => d.type === type || d.type?.includes('Business'));
      const completeness = detail ? detail.completeness : 50;
      score += 20 * (completeness / 100);
    }
  }

  // Important schemas (30 points)
  for (const type of schemas.important) {
    if (foundTypes.includes(type)) {
      score += 10;
    }
  }

  // Recommended schemas (20 points)
  let recFound = 0;
  for (const type of schemas.recommended) {
    if (foundTypes.includes(type) || foundTypes.some(t => t === 'BlogPosting' && type === 'Article')) {
      recFound++;
    }
  }
  score += Math.min((recFound / schemas.recommended.length) * 20, 20);

  // Bonus schemas (10 points)
  let bonusFound = 0;
  for (const type of schemas.bonus) {
    if (foundTypes.includes(type)) bonusFound++;
  }
  score += Math.min((bonusFound / schemas.bonus.length) * 10, 10);

  // Parse errors penalty
  const parseErrors = details.filter(d => d.type === 'PARSE_ERROR').length;
  score -= parseErrors * 5;

  return Math.round(Math.max(0, Math.min(100, score)));
}

// --- Missing opportunities ---
function findMissingOpportunities(foundTypes, html, pageType) {
  const opportunities = [];

  // Check for FAQ content without FAQ schema
  if (!foundTypes.includes('FAQPage')) {
    const hasFaqContent = /<h[2-4][^>]*>.*(?:FAQ|frequently asked|common questions)/i.test(html)
      || (html.match(/<h[2-4][^>]*>.*\?<\/h[2-4]>/gi) || []).length >= 3;
    if (hasFaqContent) {
      opportunities.push({
        type: 'FAQPage',
        reason: 'Page has question-based headings or FAQ section but no FAQPage schema.',
        impact: 'high',
      });
    }
  }

  // Check for how-to content without HowTo schema
  if (!foundTypes.includes('HowTo')) {
    const hasHowTo = /<h[1-3][^>]*>.*(?:how to|step[s]?\s|guide to)/i.test(html)
      || (html.match(/(?:step\s+\d|first,?\s|next,?\s|finally,?\s)/gi) || []).length >= 3;
    if (hasHowTo) {
      opportunities.push({
        type: 'HowTo',
        reason: 'Page has step-by-step or how-to content but no HowTo schema.',
        impact: 'medium',
      });
    }
  }

  // LocalBusiness check — only for homepage and local_business pages, not articles
  if (pageType !== 'article' && !foundTypes.some(t => t.includes('Business') || t === 'Organization')) {
    const hasAddress = /\d+\s+\w+\s+(?:Street|St|Road|Rd|Ave|Avenue|Blvd|Drive|Dr|Lane|Ln)\b/i.test(html);
    const hasPhone = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(html);
    if (hasAddress || hasPhone) {
      opportunities.push({
        type: 'LocalBusiness',
        reason: 'Page has address/phone but no LocalBusiness or Organization schema.',
        impact: 'critical',
      });
    }
  }

  // Article-specific: check for Article schema on article pages
  if (pageType === 'article' && !foundTypes.includes('Article') && !foundTypes.includes('BlogPosting')) {
    opportunities.push({
      type: 'Article',
      reason: 'Article page is missing Article/BlogPosting schema.',
      impact: 'high',
    });
  }

  // BreadcrumbList check
  if (!foundTypes.includes('BreadcrumbList')) {
    const hasBreadcrumb = /class\s*=\s*["'][^"']*breadcrumb/i.test(html)
      || /aria-label\s*=\s*["']breadcrumb/i.test(html);
    if (hasBreadcrumb) {
      opportunities.push({
        type: 'BreadcrumbList',
        reason: 'Page has breadcrumb navigation but no BreadcrumbList schema.',
        impact: 'medium',
      });
    }
  }

  // Article/BlogPosting check
  if (!foundTypes.includes('Article') && !foundTypes.includes('BlogPosting')) {
    const isArticle = /<article\b/i.test(html)
      || /class\s*=\s*["'][^"']*(?:post-content|entry-content|article-body)/i.test(html);
    if (isArticle) {
      opportunities.push({
        type: 'Article',
        reason: 'Page appears to be an article/blog post but has no Article schema.',
        impact: 'high',
      });
    }
  }

  return opportunities;
}

// --- Main ---
async function checkSchema(url) {
  let html;
  try {
    html = await fetchPage(url);
  } catch (e) {
    return { error: `Failed to fetch page: ${e.message}`, url };
  }

  // Extract page title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : url;

  // Extract JSON-LD
  const jsonLdBlocks = extractJsonLd(html);

  // Detect microdata
  const microdataTypes = detectMicrodata(html);

  // Classify
  const { found, details } = classifySchemas(jsonLdBlocks, microdataTypes);

  // Detect page type
  const pageType = detectPageType(url, found, html);

  // Find missing opportunities (page-type-aware)
  const missingOpportunities = findMissingOpportunities(found, html, pageType);

  // Calculate score based on page type
  const score = calculateSchemaScore(found, details, pageType);

  // Grade
  let grade, label;
  if (score >= 80) { grade = 'A'; label = 'Excellent Schema'; }
  else if (score >= 60) { grade = 'B'; label = 'Good Schema'; }
  else if (score >= 40) { grade = 'C'; label = 'Basic Schema'; }
  else if (score >= 20) { grade = 'D'; label = 'Minimal Schema'; }
  else { grade = 'F'; label = 'No/Broken Schema'; }

  return {
    url,
    page_title: pageTitle,
    page_type: pageType,
    schema_score: score,
    schema_grade: grade,
    schema_label: label,
    total_json_ld_blocks: jsonLdBlocks.length,
    total_microdata_types: microdataTypes.length,
    schema_types_found: found,
    schema_details: details,
    missing_opportunities: missingOpportunities,
    parse_errors: details.filter(d => d.type === 'PARSE_ERROR').length,
  };
}

// CLI entry point
const url = process.argv[2];
if (!url) {
  console.error('Usage: node schema_checker.js <url>');
  process.exit(1);
}

checkSchema(url)
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(err => {
    console.error(JSON.stringify({ error: err.message, url }));
    process.exit(1);
  });

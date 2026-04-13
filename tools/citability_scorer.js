#!/usr/bin/env node
/**
 * Citability Scorer — Analyzes content blocks for AI citation readiness.
 * Scores passages based on how likely AI models are to cite them.
 *
 * Based on research showing optimal AI-cited passages are:
 * - 134-167 words long
 * - Self-contained (extractable without context)
 * - Fact-rich with specific statistics
 * - Structured with clear answer patterns
 *
 * Usage: node citability_scorer.js <url>
 * Output: JSON with per-block scores, page average, grade distribution
 *
 * References:
 * - Georgia Tech / Princeton / IIT Delhi 2024 GEO study
 * - geo-seo-claude (github.com/zubair-trabzada/geo-seo-claude)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// --- Fetch page HTML ---
function fetchPage(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 30000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirect = new URL(res.headers.location, url).href;
        return resolve(fetchPage(redirect, redirectCount + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// --- Simple HTML parser (no dependencies) ---
function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

function extractContentBlocks(html) {
  // Remove script, style, nav, footer, header, aside, form
  let cleaned = html.replace(/<(script|style|nav|footer|header|aside|form|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

  // Find the main content area if possible
  const mainMatch = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)
    || cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
    || cleaned.match(/<div[^>]*(?:class|id)\s*=\s*["'][^"']*(?:content|main|entry|post|article)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

  const content = mainMatch ? mainMatch[1] : cleaned;

  // Split into blocks at headings
  const blocks = [];
  const headingRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let lastIndex = 0;
  let currentHeading = 'Introduction';
  let match;

  const headingPositions = [];
  while ((match = headingRegex.exec(content)) !== null) {
    headingPositions.push({
      index: match.index,
      end: match.index + match[0].length,
      level: match[1],
      text: stripTags(match[2]),
    });
  }

  for (let i = 0; i < headingPositions.length; i++) {
    const h = headingPositions[i];
    // Content before this heading belongs to previous section
    if (h.index > lastIndex) {
      const sectionHtml = content.substring(lastIndex, h.index);
      const text = extractParagraphs(sectionHtml);
      if (text.length >= 20) {
        blocks.push({ heading: currentHeading, content: text, headingLevel: '' });
      }
    }
    currentHeading = h.text;
    lastIndex = h.end;

    // If this is the last heading, grab everything after it
    if (i === headingPositions.length - 1) {
      const sectionHtml = content.substring(lastIndex);
      const text = extractParagraphs(sectionHtml);
      if (text.length >= 20) {
        blocks.push({ heading: currentHeading, content: text, headingLevel: h.level });
      }
    }
  }

  // If there were headings but we have content between last heading and end
  if (headingPositions.length === 0) {
    const text = extractParagraphs(content);
    if (text.length >= 20) {
      blocks.push({ heading: 'Introduction', content: text, headingLevel: '' });
    }
  }

  // Also capture content between headings (not just after last)
  for (let i = 0; i < headingPositions.length - 1; i++) {
    const start = headingPositions[i].end;
    const end = headingPositions[i + 1].index;
    const sectionHtml = content.substring(start, end);
    const text = extractParagraphs(sectionHtml);
    if (text.length >= 20) {
      // Check if we already captured this
      const existing = blocks.find(b => b.heading === headingPositions[i].text);
      if (!existing) {
        blocks.push({
          heading: headingPositions[i].text,
          content: text,
          headingLevel: headingPositions[i].level,
        });
      }
    }
  }

  return blocks;
}

function extractParagraphs(html) {
  const parts = [];
  // Extract text from p, li, td, blockquote elements
  const regex = /<(p|li|td|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const text = stripTags(m[2]).trim();
    if (text.length >= 10) parts.push(text);
  }
  if (parts.length === 0) {
    // Fallback: just strip all tags
    const plain = stripTags(html).trim();
    if (plain.length >= 20) return plain;
  }
  return parts.join(' ');
}

// --- Scoring functions ---
function scorePassage(text, heading) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  if (wordCount < 10) return null;

  const scores = {
    answer_block_quality: 0,
    self_containment: 0,
    structural_readability: 0,
    statistical_density: 0,
    uniqueness_signals: 0,
  };

  // === 1. Answer Block Quality (30%) ===
  let abq = 0;

  // Definition patterns
  const defPatterns = [
    /\b\w+\s+is\s+(?:a|an|the)\s/i,
    /\b\w+\s+refers?\s+to\s/i,
    /\b\w+\s+means?\s/i,
    /\b\w+\s+(?:can be |are )?defined\s+as\s/i,
    /\bin\s+(?:simple|other)\s+(?:terms|words)\s*,/i,
  ];
  for (const p of defPatterns) {
    if (p.test(text)) { abq += 15; break; }
  }

  // Answer appears early (first 60 words)
  const first60 = words.slice(0, 60).join(' ');
  if (/\b(?:is|are|was|were|means?|refers?)\b/i.test(first60) ||
      /\d+%/.test(first60) || /\$[\d,]+/.test(first60) ||
      /\d+\s+(?:million|billion|thousand)/i.test(first60)) {
    abq += 15;
  }

  // Question-based heading bonus
  if (heading && heading.endsWith('?')) abq += 10;

  // Clear sentence structure
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const shortClear = sentences.filter(s => {
    const wc = s.trim().split(/\s+/).length;
    return wc >= 5 && wc <= 25;
  }).length;
  if (sentences.length > 0) {
    abq += Math.round((shortClear / sentences.length) * 10);
  }

  // Quotable claim signals
  if (/(?:according to|research shows|studies?\s+(?:show|indicate|suggest|found)|data\s+(?:shows|indicates|suggests))/i.test(text)) {
    abq += 10;
  }

  scores.answer_block_quality = Math.min(abq, 30);

  // === 2. Self-Containment (25%) ===
  let sc = 0;

  // Optimal word count
  if (wordCount >= 134 && wordCount <= 167) sc += 10;
  else if (wordCount >= 100 && wordCount <= 200) sc += 7;
  else if (wordCount >= 80 && wordCount <= 250) sc += 4;
  else if (wordCount < 30 || wordCount > 400) sc += 0;
  else sc += 2;

  // Low pronoun density
  const pronouns = (text.match(/\b(?:it|they|them|their|this|that|these|those|he|she|his|her)\b/gi) || []).length;
  if (wordCount > 0) {
    const ratio = pronouns / wordCount;
    if (ratio < 0.02) sc += 8;
    else if (ratio < 0.04) sc += 5;
    else if (ratio < 0.06) sc += 3;
  }

  // Named entities (proper nouns)
  const properNouns = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || []).length;
  if (properNouns >= 3) sc += 7;
  else if (properNouns >= 1) sc += 4;

  scores.self_containment = Math.min(sc, 25);

  // === 3. Structural Readability (20%) ===
  let sr = 0;

  if (sentences.length > 0) {
    const avgLen = wordCount / sentences.length;
    if (avgLen >= 10 && avgLen <= 20) sr += 8;
    else if (avgLen >= 8 && avgLen <= 25) sr += 5;
    else sr += 2;
  }

  // List-like structures
  if (/(?:first|second|third|finally|additionally|moreover|furthermore)/i.test(text)) sr += 4;

  // Numbered items
  if (/(?:\d+[.)]\s|\b(?:step|tip|point)\s+\d+)/i.test(text)) sr += 4;

  // Paragraph breaks
  if (text.includes('\n')) sr += 4;

  scores.structural_readability = Math.min(sr, 20);

  // === 4. Statistical Density (15%) ===
  let sd = 0;

  // Percentages
  const pctCount = (text.match(/\d+(?:\.\d+)?%/g) || []).length;
  sd += Math.min(pctCount * 3, 6);

  // Dollar amounts
  const dollarCount = (text.match(/\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|M|B|K))?/gi) || []).length;
  sd += Math.min(dollarCount * 3, 5);

  // Numbers with context
  const numContext = (text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\s+(?:users|customers|pages|sites|companies|businesses|people|percent|times|years|months|homes|windows|doors)/gi) || []).length;
  sd += Math.min(numContext * 2, 4);

  // Year references
  if (/\b20(?:2[3-6]|1\d)\b/.test(text)) sd += 2;

  // Named sources
  if (/(?:according to|per|from|by)\s+[A-Z]/i.test(text)) sd += 2;

  scores.statistical_density = Math.min(sd, 15);

  // === 5. Uniqueness Signals (10%) ===
  let us = 0;

  if (/(?:our\s+(?:research|study|data|analysis|survey|findings)|we\s+(?:found|discovered|analyzed|surveyed|measured))/i.test(text)) us += 5;
  if (/(?:case study|for example|for instance|in practice|real-world|hands-on)/i.test(text)) us += 3;
  if (/(?:using|with|via|through)\s+[A-Z][a-z]+/.test(text)) us += 2;

  scores.uniqueness_signals = Math.min(us, 10);

  // === Total ===
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  let grade, label;
  if (total >= 80) { grade = 'A'; label = 'Highly Citable'; }
  else if (total >= 65) { grade = 'B'; label = 'Good Citability'; }
  else if (total >= 50) { grade = 'C'; label = 'Moderate Citability'; }
  else if (total >= 35) { grade = 'D'; label = 'Low Citability'; }
  else { grade = 'F'; label = 'Poor Citability'; }

  return {
    heading,
    word_count: wordCount,
    total_score: total,
    grade,
    label,
    breakdown: scores,
    preview: words.slice(0, 30).join(' ') + (wordCount > 30 ? '...' : ''),
  };
}

// --- Main ---
async function analyzePageCitability(url) {
  let html;
  try {
    html = await fetchPage(url);
  } catch (e) {
    return { error: `Failed to fetch page: ${e.message}`, url };
  }

  // Extract page title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? stripTags(titleMatch[1]).trim() : url;

  // Extract content blocks
  const blocks = extractContentBlocks(html);

  // Score each block
  const scoredBlocks = [];
  for (const block of blocks) {
    const score = scorePassage(block.content, block.heading);
    if (score) scoredBlocks.push(score);
  }

  // Page-level metrics
  const avgScore = scoredBlocks.length > 0
    ? Math.round(scoredBlocks.reduce((sum, b) => sum + b.total_score, 0) / scoredBlocks.length * 10) / 10
    : 0;

  const topBlocks = [...scoredBlocks].sort((a, b) => b.total_score - a.total_score).slice(0, 5);
  const bottomBlocks = [...scoredBlocks].sort((a, b) => a.total_score - b.total_score).slice(0, 5);

  const optimalCount = scoredBlocks.filter(b => b.word_count >= 134 && b.word_count <= 167).length;
  const aboveSeventy = scoredBlocks.filter(b => b.total_score >= 70).length;

  const gradeDist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const block of scoredBlocks) gradeDist[block.grade]++;

  // Page-level grade
  let pageGrade, pageLabel;
  if (avgScore >= 80) { pageGrade = 'A'; pageLabel = 'Highly Citable'; }
  else if (avgScore >= 65) { pageGrade = 'B'; pageLabel = 'Good Citability'; }
  else if (avgScore >= 50) { pageGrade = 'C'; pageLabel = 'Moderate Citability'; }
  else if (avgScore >= 35) { pageGrade = 'D'; pageLabel = 'Low Citability'; }
  else { pageGrade = 'F'; pageLabel = 'Poor Citability'; }

  return {
    url,
    page_title: pageTitle,
    total_blocks_analyzed: scoredBlocks.length,
    average_citability_score: avgScore,
    page_grade: pageGrade,
    page_label: pageLabel,
    optimal_length_passages: optimalCount,
    citability_coverage: scoredBlocks.length > 0
      ? Math.round((aboveSeventy / scoredBlocks.length) * 100)
      : 0,
    grade_distribution: gradeDist,
    top_5_citable: topBlocks,
    bottom_5_citable: bottomBlocks,
    all_blocks: scoredBlocks,
  };
}

// CLI entry point
const url = process.argv[2];
if (!url) {
  console.error('Usage: node citability_scorer.js <url>');
  process.exit(1);
}

analyzePageCitability(url)
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(err => {
    console.error(JSON.stringify({ error: err.message, url }));
    process.exit(1);
  });

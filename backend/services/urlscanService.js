const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://urlscan.io/api/v1';
const SCAN_URL = 'https://urlscan.io/api/v1/scan';
const TIMEOUT = 30000;
const MAX_RETRIES = 3;
const CACHE_TTL = 600000; // 10 minutes
const SCAN_POLL_INTERVAL = 5000; // 5 seconds
const SCAN_MAX_POLLS = 12; // 60 seconds max

const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Submit a URL for scanning on URLScan.io
 * @param {string} url - URL to scan
 * @param {string} apiKey - URLScan.io API key
 * @returns {Object} Scan result
 */
async function scanUrl(url, apiKey) {
  const cacheKey = `urlscan_${url}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Submit scan
      const scanResponse = await axios.post(SCAN_URL,
        { url, visibility: 'public' },
        {
          headers: {
            'API-Key': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: TIMEOUT
        }
      );

      const scanId = scanResponse.data?.uuid;
      if (!scanId) throw new Error('No scan UUID returned');

      // Poll for results
      let result = null;
      for (let poll = 0; poll < SCAN_MAX_POLLS; poll++) {
        await sleep(SCAN_POLL_INTERVAL);

        try {
          const resultResponse = await axios.get(`${BASE_URL}/result/${scanId}`, {
            timeout: TIMEOUT
          });

          if (resultResponse.status === 200) {
            result = resultResponse.data;
            break;
          }
        } catch (pollError) {
          if (pollError.response?.status !== 404) {
            throw pollError;
          }
          // 404 means not ready yet, continue polling
        }
      }

      if (!result) {
        throw new Error('Scan timed out waiting for results');
      }

      const parsed = parseResponse(result, url);
      setCache(cacheKey, parsed);
      return parsed;
} catch (error) {
      const status = error.response?.status;
      // Retry ONLY transient failures: 429 (rate limit) and network errors.
      // Never retry 400/401/403/404 or other client errors.
      const isNetwork = !error.response || ['ECONNABORTED', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENETUNREACH', 'EPIPE'].includes(error.code);
      const isRateLimited = status === 429;

      if (isRateLimited) {
        await sleep(5000 * attempt);
        continue;
      }
      if (isNetwork && attempt < MAX_RETRIES) {
        await sleep(2000 * attempt);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`URLScan.io scan failed for ${url}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      throw error;
    }
  }
}

/**
 * Get URLScan.io search results for a domain/URL
 * @param {string} query - Search query
 * @param {string} apiKey - URLScan.io API key
 * @returns {Object} Search results
 */
async function search(query, apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/search/`, {
      params: { q: query, size: 10 },
      headers: { 'API-Key': apiKey },
      timeout: TIMEOUT
    });

    return {
      scanned: true,
      total: response.data.total || 0,
      results: (response.data.results || []).map(r => ({
        scanId: r._id,
        url: r.page?.url,
        domain: r.page?.domain,
        ip: r.page?.ip,
        country: r.page?.country,
        server: r.page?.server,
        status: r.page?.status,
        title: r.page?.title,
        screenshot: r.screenshot ? `https://urlscan.io/screenshots/${r.uuid}.png` : null,
        threatScore: r.score || 0,
        scanDate: r.task?.time
      }))
    };
  } catch (error) {
    logger.error(`URLScan.io search failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseResponse(data, originalUrl) {
  const page = data.page || {};
  const verdicts = data.verdicts || {};
  const lists = data.lists || {};
  const stats = data.stats || {};

  // Calculate threat score from various signals
  let threatScore = 0;
  const signals = [];

  // Malicious verdicts
  if (verdicts.overall?.malicious) {
    threatScore += 40;
    signals.push('flagged as malicious');
  }

  // Google Safe Browsing
  if (verdicts.google?.malicious) {
    threatScore += 20;
    signals.push('flagged by Google Safe Browsing');
  }

  // Engine detections
  const engineMalicious = stats.malicious || 0;
  const engineTotal = stats.engines || 1;
  if (engineMalicious > 0) {
    threatScore += Math.min((engineMalicious / engineTotal) * 50, 50);
    signals.push(`${engineMalicious}/${engineTotal} engines detected malicious`);
  }

  // Suspicious IPs/Hosts
  if (lists.ips && lists.ips.length > 0) {
    const suspiciousIps = lists.ips.filter(ip =>
      ip.indexOf('suspicious') !== -1 || ip.indexOf('malicious') !== -1
    );
    threatScore += suspiciousIps.length * 5;
  }

  // Country risk (simplified)
  const highRiskCountries = ['ru', 'cn', 'kp', 'ir', 'sy', 'cu', 've'];
  if (page.country && highRiskCountries.includes(page.country.toLowerCase())) {
    threatScore += 10;
    signals.push(`hosted in high-risk country: ${page.country}`);
  }

  return {
    scanned: true,
    url: page.url || originalUrl,
    domain: page.domain,
    ip: page.ip,
    country: page.country,
    city: page.city,
    server: page.server,
    status: page.status,
    title: page.title,
    threatScore: Math.min(threatScore, 100),
    screenshot: data.screenshot ? `https://urlscan.io/screenshots/${data.uuid}.png` : null,
    scanId: data.uuid,
    scanUrl: `https://urlscan.io/result/${data.uuid}`,
    malicious: verdicts.overall?.malicious || false,
    signals,
    domainStats: stats,
    redirects: (data.redirects || []).map(r => ({
      url: r.url,
      ip: r.ip,
      status: r.status
    })),
    cookies: (data.cookies || []).slice(0, 20).map(c => ({
      name: c.name,
      domain: c.domain,
      path: c.path,
      secure: c.secure,
      httpOnly: c.httpOnly
    })),
    consoleMessages: (data.console || []).slice(0, 20).map(m => ({
      level: m.level,
      text: m.text?.substring(0, 500) || ''
    })),
    harvestedData: data.harvested ? {
      emails: (data.harvested.emails || []).slice(0, 20),
      hashtags: (data.harvested.hashtags || []).slice(0, 20),
      phones: (data.harvested.phones || []).slice(0, 20)
    } : null
  };
}

module.exports = { scanUrl, search };


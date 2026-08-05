const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://safebrowsing.googleapis.com/v4';
const TIMEOUT = 15000;
const MAX_RETRIES = 2;
const CACHE_TTL = 300000;

const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Threat types Google Safe Browsing can detect
const THREAT_TYPES = [
  'MALWARE',
  'SOCIAL_ENGINEERING',
  'UNWANTED_SOFTWARE',
  'POTENTIALLY_HARMFUL_APPLICATION',
  'THREAT_TYPE_UNSPECIFIED'
];

// Platform types
const PLATFORM_TYPES = [
  'ANY_PLATFORM',
  'WINDOWS',
  'LINUX',
  'OSX',
  'ANDROID',
  'IOS',
  'CHROME'
];

/**
 * Check a URL against Google Safe Browsing
 * @param {string} url - The URL to check
 * @param {string} apiKey - Google Safe Browsing API key
 * @returns {Object} Safe Browsing results
 */
async function checkUrl(url, apiKey) {
  const cacheKey = `gsb_${url}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const requestBody = {
        client: {
          clientId: 'sentinelx-ai',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: THREAT_TYPES,
          platformTypes: PLATFORM_TYPES,
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      };

      const response = await axios.post(
        `${BASE_URL}/threatMatches:find?key=${apiKey}`,
        requestBody,
        { timeout: TIMEOUT }
      );

      const result = parseResponse(response.data, url);
      setCache(cacheKey, result);
      return result;
} catch (error) {
      const status = error.response?.status;
      // Retry ONLY transient failures: 429 (rate limit) and network errors.
      // Never retry 400/401/403/404 or other client errors.
      const isNetwork = !error.response || ['ECONNABORTED', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENETUNREACH', 'EPIPE'].includes(error.code);
      const isRateLimited = status === 429;

      if (isRateLimited) {
        await sleep(2000 * attempt);
        continue;
      }
      if (isNetwork && attempt < MAX_RETRIES) {
        await sleep(1000 * attempt);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`Google Safe Browsing check failed for URL ${url}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      throw error;
    }
  }
}

/**
 * Check multiple URLs against Google Safe Browsing
 * @param {string[]} urls - Array of URLs
 * @param {string} apiKey - Google Safe Browsing API key
 * @returns {Object} Results for all URLs
 */
async function checkUrls(urls, apiKey) {
  try {
    const requestBody = {
      client: {
        clientId: 'sentinelx-ai',
        clientVersion: '1.0.0'
      },
      threatInfo: {
        threatTypes: THREAT_TYPES,
        platformTypes: PLATFORM_TYPES,
        threatEntryTypes: ['URL'],
        threatEntries: urls.map(url => ({ url }))
      }
    };

    const response = await axios.post(
      `${BASE_URL}/threatMatches:find?key=${apiKey}`,
      requestBody,
      { timeout: TIMEOUT }
    );

    return parseBulkResponse(response.data, urls);
  } catch (error) {
    logger.error(`Google Safe Browsing bulk check failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Check hash prefix against Google Safe Browsing (full hash throttled)
 * @param {string} hash - SHA256 hash
 * @param {string} apiKey - Google Safe Browsing API key
 * @returns {Object} Hash match results
 */
async function checkHash(hash, apiKey) {
  try {
    const hashPrefix = hash.substring(0, 32); // Use first 32 chars as prefix
    const response = await axios.get(
      `${BASE_URL}/fullHashes:find?hashPrefix=${hashPrefix}&key=${apiKey}`,
      { timeout: TIMEOUT }
    );

    return parseHashResponse(response.data, hash);
  } catch (error) {
    logger.error(`Google Safe Browsing hash check failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseResponse(data, url) {
  const matches = data?.matches || [];

  if (matches.length === 0) {
    return {
      scanned: true,
      safe: true,
      threatScore: 0,
      matches: [],
      url
    };
  }

  const threatScore = Math.min(matches.length * 25, 100);
  const threatTypes = [...new Set(matches.map(m => m.threatType))];

  return {
    scanned: true,
    safe: false,
    threatScore,
    matches: matches.map(m => ({
      threatType: m.threatType,
      platformType: m.platformType,
      threatEntryType: m.threatEntryType,
      cacheDuration: m.cacheDuration
    })),
    threatTypes,
    url,
    malicious: true
  };
}

function parseBulkResponse(data, urls) {
  const matches = data?.matches || [];
  const matchedUrls = new Set(matches.map(m => m.threat?.url));

  return {
    scanned: true,
    totalUrls: urls.length,
    maliciousUrls: matchedUrls.size,
    safeUrls: urls.length - matchedUrls.size,
    threatScore: matchedUrls.size > 0 ? Math.min((matchedUrls.size / urls.length) * 100, 100) : 0,
    matches: matches.map(m => ({
      url: m.threat?.url,
      threatType: m.threatType,
      platformType: m.platformType
    }))
  };
}

function parseHashResponse(data, hash) {
  const matches = data?.matches || [];
  const fullHashMatches = matches.filter(m => m.fullHash === hash);

  return {
    scanned: true,
    found: fullHashMatches.length > 0,
    threatScore: fullHashMatches.length > 0 ? 80 : 0,
    matches: fullHashMatches.map(m => ({
      threatType: m.threatType,
      platformType: m.platformType,
      cacheDuration: m.cacheDuration
    }))
  };
}

module.exports = { checkUrl, checkUrls, checkHash };


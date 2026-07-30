const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.greynoise.io/v3';
const COMMUNITY_URL = 'https://api.greynoise.io/v3/community';
const TIMEOUT = 15000;
const MAX_RETRIES = 3;
const CACHE_TTL = 300000; // 5 minutes

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
 * Lookup an IP using GreyNoise Community API (no key required)
 * @param {string} ip - IP address
 * @param {string} apiKey - GreyNoise API key (optional for community endpoint)
 * @returns {Object} GreyNoise community intelligence
 */
async function lookupIP(ip, apiKey) {
  const cacheKey = `greynoise_${ip}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Try the community endpoint first (no key needed for this)
      const response = await axios.get(`${COMMUNITY_URL}/${ip}`, {
        timeout: TIMEOUT,
        headers: apiKey ? { key: apiKey } : {}
      });

      const result = parseCommunityResponse(response.data);
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      // If community endpoint fails and we have an API key, try the full endpoint
      if (error.response?.status === 404) {
        // IP not found in GreyNoise
        const result = {
          scanned: true,
          found: false,
          ip,
          noise: false,
          riot: false,
          classification: 'unknown',
          threatScore: 0,
          message: 'IP not found in GreyNoise'
        };
        setCache(cacheKey, result);
        return result;
      }

      if (error.response?.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }

      if (attempt === MAX_RETRIES) {
        // If community endpoint fails and we have a key, try the full API
        if (apiKey && apiKey.length > 10) {
          try {
            const fullResponse = await axios.get(`${BASE_URL}/noise/context/${ip}`, {
              headers: { key: apiKey },
              timeout: TIMEOUT
            });
            const result = parseFullResponse(fullResponse.data);
            setCache(cacheKey, result);
            return result;
          } catch (fullError) {
            logger.error(`GreyNoise full lookup failed for IP ${ip}: ${fullError.message}`);
            return { error: fullError.message, scanned: false };
          }
        }
        logger.error(`GreyNoise community lookup failed for IP ${ip}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Quick IP check using GreyNoise Community API
 * @param {string} ip - IP address
 * @returns {Object} Quick check result
 */
async function quickCheck(ip) {
  try {
    const response = await axios.get(`${COMMUNITY_URL}/${ip}`, {
      timeout: TIMEOUT
    });

    const data = response.data;
    return {
      scanned: true,
      ip,
      noise: data.noise || false,
      riot: data.riot || false,
      classification: data.classification || 'unknown',
      name: data.name || null,
      lastSeen: data.last_seen || null,
      link: data.link || null,
      message: data.message || null
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        scanned: true,
        ip,
        noise: false,
        riot: false,
        classification: 'unknown',
        found: false
      };
    }
    logger.error(`GreyNoise quick check failed for IP ${ip}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get noise context for an IP (requires API key)
 * @param {string} ip - IP address
 * @param {string} apiKey - GreyNoise API key
 * @returns {Object} Full noise context
 */
async function getNoiseContext(ip, apiKey) {
  if (!apiKey) {
    return { error: 'API key required for noise context', scanned: false };
  }

  try {
    const response = await axios.get(`${BASE_URL}/noise/context/${ip}`, {
      headers: { key: apiKey },
      timeout: TIMEOUT
    });

    return parseFullResponse(response.data);
  } catch (error) {
    logger.error(`GreyNoise noise context failed for IP ${ip}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Search GreyNoise by query (requires API key)
 * @param {string} query - Search query
 * @param {string} apiKey - GreyNoise API key
 * @returns {Object} Search results
 */
async function search(query, apiKey) {
  if (!apiKey) {
    return { error: 'API key required for search', scanned: false };
  }

  try {
    const response = await axios.get(`${BASE_URL}/search/gnql`, {
      params: { query },
      headers: { key: apiKey },
      timeout: TIMEOUT
    });

    const data = response.data;
    return {
      scanned: true,
      count: data.count || 0,
      total: data.total || 0,
      results: (data.data || []).slice(0, 50).map(r => ({
        ip: r.ip,
        noise: r.noise,
        riot: r.riot,
        classification: r.classification,
        name: r.name,
        lastSeen: r.last_seen,
        firstSeen: r.first_seen,
        tags: r.tags || [],
        metadata: {
          country: r.metadata?.country || null,
          city: r.metadata?.city || null,
          organization: r.metadata?.organization || null,
          asn: r.metadata?.asn || null,
          category: r.metadata?.category || null
        },
        rawData: r.raw_data ? {
          scan: r.raw_data.scan || [],
          web: r.raw_data.web || [],
          ja3: r.raw_data.ja3 || []
        } : null
      }))
    };
  } catch (error) {
    logger.error(`GreyNoise search failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get recent noisy IPs (requires API key)
 * @param {string} apiKey - GreyNoise API key
 * @param {number} limit - Number of results
 * @returns {Object} Recent noise data
 */
async function getRecentNoise(apiKey, limit = 20) {
  if (!apiKey) {
    return { error: 'API key required for recent noise', scanned: false };
  }

  try {
    const response = await axios.get(`${BASE_URL}/noise/context`, {
      params: { limit },
      headers: { key: apiKey },
      timeout: TIMEOUT
    });

    const data = response.data;
    return {
      scanned: true,
      count: data.data?.length || 0,
      results: (data.data || []).slice(0, limit).map(r => ({
        ip: r.ip,
        classification: r.classification,
        name: r.name,
        lastSeen: r.last_seen,
        firstSeen: r.first_seen,
        tags: r.tags || [],
        metadata: r.metadata ? {
          country: r.metadata.country,
          organization: r.metadata.organization,
          asn: r.metadata.asn
        } : null
      }))
    };
  } catch (error) {
    logger.error(`GreyNoise get recent noise failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseCommunityResponse(data) {
  if (!data) {
    return { scanned: true, found: false };
  }

  const isNoise = data.noise || false;
  const isRiot = data.riot || false;

  // Threat score based on classification
  let threatScore = 0;
  if (data.classification === 'malicious') threatScore = 80;
  else if (data.classification === 'suspicious') threatScore = 50;

  return {
    scanned: true,
    found: true,
    ip: data.ip,
    noise: isNoise,
    riot: isRiot,
    classification: data.classification || 'unknown',
    name: data.name || null,
    lastSeen: data.last_seen || null,
    link: data.link || null,
    message: data.message || null,
    threatScore,
    isMalicious: data.classification === 'malicious',
    isSuspicious: data.classification === 'suspicious',
    isBenign: data.classification === 'benign',
    tags: data.tags || []
  };
}

function parseFullResponse(data) {
  if (!data) {
    return { scanned: true, found: false };
  }

  const isNoise = data.noise || false;
  const isRiot = data.riot || false;

  let threatScore = 0;
  if (data.classification === 'malicious') threatScore = 85;
  else if (data.classification === 'suspicious') threatScore = 55;
  else if (isNoise && !isRiot) threatScore = 30;
  else if (isRiot) threatScore = 5;

  return {
    scanned: true,
    found: true,
    ip: data.ip,
    noise: isNoise,
    riot: isRiot,
    classification: data.classification || 'unknown',
    name: data.name || null,
    lastSeen: data.last_seen || null,
    firstSeen: data.first_seen || null,
    threatScore,
    isMalicious: data.classification === 'malicious',
    isSuspicious: data.classification === 'suspicious',
    isBenign: data.classification === 'benign',
    tags: data.tags || [],
    metadata: data.metadata ? {
      country: data.metadata.country,
      city: data.metadata.city,
      organization: data.metadata.organization,
      asn: data.metadata.asn,
      category: data.metadata.category,
      os: data.metadata.os
    } : null,
    rawData: data.raw_data ? {
      scan: (data.raw_data.scan || []).map(s => ({
        port: s.port,
        protocol: s.protocol,
        fingerprint: s.fingerprint
      })),
      web: (data.raw_data.web || []).map(w => ({
        url: w.url,
        method: w.method,
        userAgent: w.user_agent
      })),
      ja3: (data.raw_data.ja3 || []).map(j => ({
        hash: j.hash,
        fingerprint: j.fingerprint
      }))
    } : null,
    actor: data.actor || null,
    cve: data.cve || [],
    botnet: data.botnet || null,
    malware: data.malware || null,
    category: data.category || null
  };
}

module.exports = {
  lookupIP,
  quickCheck,
  getNoiseContext,
  search,
  getRecentNoise
};

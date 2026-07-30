const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://pulsedive.com/api';
const TIMEOUT = 15000;
const MAX_RETRIES = 3;
const CACHE_TTL = 300000;

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
 * Lookup an indicator on Pulsedive
 * @param {string} indicator - Indicator value (IP, URL, domain, hash)
 * @param {string} apiKey - Pulsedive API key
 * @returns {Object} Pulsedive intelligence
 */
async function lookupIndicator(indicator, apiKey) {
  const cacheKey = `pulsedive_${indicator}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/info.php`, {
        params: {
          indicator,
          key: apiKey,
          pretty: 1
        },
        timeout: TIMEOUT
      });

      const result = parseResponse(response.data);
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`Pulsedive lookup failed for ${indicator}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Get recent threats from Pulsedive
 * @param {string} apiKey - Pulsedive API key
 * @param {number} limit - Number of results
 * @returns {Object} Recent threats
 */
async function getRecentThreats(apiKey, limit = 20) {
  try {
    const response = await axios.get(`${BASE_URL}/getrecent.php`, {
      params: {
        key: apiKey,
        limit,
        pretty: 1
      },
      timeout: TIMEOUT
    });

    const results = response.data?.results || response.data || [];
    return {
      scanned: true,
      count: Array.isArray(results) ? results.length : 0,
      threats: (Array.isArray(results) ? results : []).slice(0, limit).map(r => ({
        id: r.iid || r.id,
        indicator: r.indicator,
        type: r.type,
        threat: r.threat,
        risk: r.risk,
        updated: r.updated,
        summary: r.summary?.substring(0, 500) || ''
      }))
    };
  } catch (error) {
    logger.error(`Pulsedive get recent threats failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Search Pulsedive by query
 * @param {string} query - Search query
 * @param {string} apiKey - Pulsedive API key
 * @returns {Object} Search results
 */
async function search(query, apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/search.php`, {
      params: {
        key: apiKey,
        q: query,
        pretty: 1
      },
      timeout: TIMEOUT
    });

    const results = response.data?.results || [];
    return {
      scanned: true,
      count: results.length,
      results: results.map(r => ({
        iid: r.iid,
        indicator: r.indicator,
        type: r.type,
        risk: r.risk,
        threat: r.threat,
        updated: r.updated,
        recent: r.recent
      }))
    };
  } catch (error) {
    logger.error(`Pulsedive search failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseResponse(data) {
  // Calculate risk from Pulsedive risk level
  const riskLevels = { 'none': 0, 'low': 20, 'medium': 50, 'high': 75, 'critical': 95 };
  const risk = (data.risk || 'none').toLowerCase();
  const threatScore = riskLevels[risk] || 0;

  // Safely extract attributes - it may be an array, object or missing
  let attributes = [];
  if (Array.isArray(data.attributes)) {
    attributes = data.attributes.slice(0, 30).map(a => ({
      name: a.name,
      value: a.value,
      category: a.category,
      risk: a.risk
    }));
  }

  // Safely extract feeds
  let feeds = [];
  if (Array.isArray(data.feeds)) {
    feeds = data.feeds.slice(0, 10).map(f => ({
      name: f.name,
      description: f.description,
      category: f.category,
      risk: f.risk
    }));
  }

  return {
    scanned: true,
    indicator: data.indicator,
    type: data.type,
    risk,
    threatScore,
    threat: data.threat || false,
    summary: data.summary || null,
    updated: data.updated,
    riskFactors: data.risk_factor || null,
    whois: data.whois ? {
      registrar: data.whois.registrar,
      registrant: data.whois.registrant_name,
      org: data.whois.registrant_org,
      email: data.whois.registrant_email,
      country: data.whois.registrant_country,
      created: data.whois.created,
      expires: data.whois.expires,
      nameservers: data.whois.name_servers || []
    } : null,
    ssl: data.ssl ? {
      valid: data.ssl.valid,
      issuer: data.ssl.issuer,
      subject: data.ssl.subject,
      hash: data.ssl.hash,
      organization: data.ssl.organization,
      issued: data.ssl.issued,
      expires: data.ssl.expires
    } : null,
    dns: data.dns ? {
      a: data.dns.a || [],
      aaaa: data.dns.aaaa || [],
      mx: data.dns.mx || [],
      ns: data.dns.ns || [],
      cname: data.dns.cname || [],
      txt: data.dns.txt || []
    } : null,
    reputation: data.reputation ? {
      score: data.reputation.score,
      votes: data.reputation.votes,
      community: data.reputation.community
    } : null,
    attributes,
    feeds,
    properties: data.properties ? {
      malwareType: data.properties.malware_type,
      malwareFamily: data.properties.malware_family,
      campaign: data.properties.campaign,
      actor: data.properties.actor,
      attackType: data.properties.attack_type,
      target: data.properties.target
    } : null
  };
}

module.exports = { lookupIndicator, getRecentThreats, search };

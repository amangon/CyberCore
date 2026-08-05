const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://otx.alienvault.com/api/v1';
const TIMEOUT = 20000;
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

async function makeRequest(url, apiKey, retries = MAX_RETRIES) {
  const cached = getCached(url);
  if (cached) return cached;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: { 'X-OTX-API-KEY': apiKey },
        timeout: TIMEOUT
      });
      setCache(url, response.data);
      return response.data;
    } catch (error) {
      const status = error.response?.status;

      // Retry ONLY transient failures: 429 (rate limit) and network errors.
      // Never retry 400/401/403/404 or other client errors.
      const isNetwork = !error.response || ['ECONNABORTED', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN']
        .includes(error.code);
      const isRateLimited = status === 429;

      if (isRateLimited) {
        await sleep(2000 * attempt);
        continue;
      }
      if (isNetwork && attempt < retries) {
        await sleep(1000 * attempt);
        continue;
      }
      throw error;
    }
  }
}

/**
 * Lookup an IP address on AlienVault OTX
 * @param {string} ip - IP address
 * @param {string} apiKey - OTX API key
 * @returns {Object} OTX intelligence data
 */
async function lookupIP(ip, apiKey) {
  try {
    const [general, geo, reputation, malware] = await Promise.allSettled([
      makeRequest(`${BASE_URL}/indicators/IPv4/${ip}/general`, apiKey),
      makeRequest(`${BASE_URL}/indicators/IPv4/${ip}/geo`, apiKey),
      makeRequest(`${BASE_URL}/indicators/IPv4/${ip}/reputation`, apiKey),
      makeRequest(`${BASE_URL}/indicators/IPv4/${ip}/malware`, apiKey)
    ]);

    return parseIpResponse({
      general: general.status === 'fulfilled' ? general.value : null,
      geo: geo.status === 'fulfilled' ? geo.value : null,
      reputation: reputation.status === 'fulfilled' ? reputation.value : null,
      malware: malware.status === 'fulfilled' ? malware.value : null
    });
  } catch (error) {
    logger.error(`OTX IP lookup failed for ${ip}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Lookup a domain on AlienVault OTX
 * @param {string} domain - Domain name
 * @param {string} apiKey - OTX API key
 * @returns {Object} OTX intelligence data
 */
async function lookupDomain(domain, apiKey) {
  try {
    const [general, geo, malware, urlList] = await Promise.allSettled([
      makeRequest(`${BASE_URL}/indicators/domain/${domain}/general`, apiKey),
      makeRequest(`${BASE_URL}/indicators/domain/${domain}/geo`, apiKey),
      makeRequest(`${BASE_URL}/indicators/domain/${domain}/malware`, apiKey),
      makeRequest(`${BASE_URL}/indicators/domain/${domain}/url_list`, apiKey)
    ]);

    return parseDomainResponse({
      general: general.status === 'fulfilled' ? general.value : null,
      geo: geo.status === 'fulfilled' ? geo.value : null,
      malware: malware.status === 'fulfilled' ? malware.value : null,
      urlList: urlList.status === 'fulfilled' ? urlList.value : null
    });
  } catch (error) {
    logger.error(`OTX domain lookup failed for ${domain}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Lookup a URL on AlienVault OTX
 *
 * OTX only supports URL lookups for URLs that have been seen on their feeds.
 * It requires the URL base64-encoded (no padding) in the `indicators/url`
 * endpoint. A URL that cannot be represented (e.g. malformed) or that OTX
 * rejects with 400 is surfaced as "Unsupported URL" / "No Result" instead of
 * a generic "Bad Request" error.
 *
 * @param {string} url - URL
 * @param {string} apiKey - OTX API key
 * @returns {Object} OTX intelligence data
 */
async function lookupURL(url, apiKey) {
  try {
    // Validate the URL before encoding — invalid URLs are never sent upstream.
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return { scanned: true, found: false, threatScore: 0, pulseCount: 0, message: 'Unsupported URL' };
    }
    if (!/^https?:$/.test(parsed.protocol)) {
      return { scanned: true, found: false, threatScore: 0, pulseCount: 0, message: 'Unsupported URL' };
    }

    const encodedUrl = Buffer.from(url).toString('base64').replace(/=/g, '');
    const data = await makeRequest(`${BASE_URL}/indicators/url/${encodedUrl}/general`, apiKey);
    return parseUrlResponse(data);
  } catch (error) {
    const status = error.response?.status;
    // 400 means OTX doesn't accept this URL representation (e.g. unsupported
    // scheme or non-canonical form). Surface as "No Result", never as a hard
    // failure — the rest of the scan pipeline must continue.
    if (status === 400) {
      return { scanned: true, found: false, threatScore: 0, pulseCount: 0, message: 'Unsupported URL' };
    }
    if (status === 404) {
      return { scanned: true, found: false, threatScore: 0, pulseCount: 0, message: 'No Result' };
    }
    if (status === 401 || status === 403) {
      return { scanned: false, error: status === 401 ? 'Authentication Failed' : 'Forbidden' };
    }
    logger.error(`OTX URL lookup failed for ${url}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Lookup a hash on AlienVault OTX
 * @param {string} hash - File hash (MD5/SHA1/SHA256)
 * @param {string} apiKey - OTX API key
 * @returns {Object} OTX intelligence data
 */
async function lookupHash(hash, apiKey) {
  try {
    const [general, analysis] = await Promise.allSettled([
      makeRequest(`${BASE_URL}/indicators/file/${hash}/general`, apiKey),
      makeRequest(`${BASE_URL}/indicators/file/${hash}/analysis`, apiKey)
    ]);

    return parseHashResponse({
      general: general.status === 'fulfilled' ? general.value : null,
      analysis: analysis.status === 'fulfilled' ? analysis.value : null
    });
  } catch (error) {
    logger.error(`OTX hash lookup failed for ${hash}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get pulses (threat intelligence summaries) from OTX
 * @param {string} apiKey - OTX API key
 * @param {number} limit - Number of pulses to fetch
 * @returns {Object} OTX pulses
 */
async function getPulses(apiKey, limit = 20) {
  try {
    const data = await makeRequest(`${BASE_URL}/pulses/subscribed?limit=${limit}`, apiKey);
    return {
      scanned: true,
      count: data?.results?.length || 0,
      pulses: (data?.results || []).map(pulse => ({
        id: pulse.id,
        name: pulse.name,
        description: pulse.description?.substring(0, 500) || '',
        threatType: pulse.threat_type,
        severity: pulse.severity,
        tags: pulse.tags || [],
        created: pulse.created,
        modified: pulse.modified
      }))
    };
  } catch (error) {
    logger.error(`OTX get pulses failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseIpResponse(data) {
  const general = data.general || {};
  const geo = data.geo || {};
  const reputation = data.reputation || {};
  const malware = data.malware || {};

  const pulseCount = general.pulse_info?.count || 0;
  const threatScore = Math.min(pulseCount * 10, 100);

  return {
    scanned: true,
    threatScore,
    pulseCount,
    type: 'IPv4',
    country: geo.country_name || geo.country_code || null,
    city: geo.city || null,
    latitude: geo.latitude || null,
    longitude: geo.longitude || null,
    asn: general.asn || null,
    reputation: reputation.reputation || null,
    malwareSamples: (malware.data || []).slice(0, 20).map(s => ({
      hash: s.hash,
      date: s.date,
      domain: s.domain,
      ip: s.ip
    })),
    pulses: (general.pulse_info?.pulses || []).slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description?.substring(0, 300) || '',
      severity: p.severity,
      tags: p.tags || []
    })),
    relatedUrls: (general.url_list?.url_list || []).slice(0, 10).map(u => u.url)
  };
}

function parseDomainResponse(data) {
  const general = data.general || {};
  const geo = data.geo || {};
  const malware = data.malware || {};
  const urlList = data.urlList || {};

  const pulseCount = general.pulse_info?.count || 0;
  const threatScore = Math.min(pulseCount * 15, 100);

  return {
    scanned: true,
    threatScore,
    pulseCount,
    whois: general.whois || null,
    country: geo.country_name || null,
    city: geo.city || null,
    malwareSamples: (malware.data || []).slice(0, 20).map(s => ({
      hash: s.hash,
      date: s.date,
      domain: s.domain
    })),
    relatedUrls: (urlList.url_list || []).slice(0, 20).map(u => u.url),
    pulses: (general.pulse_info?.pulses || []).slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description?.substring(0, 300) || '',
      severity: p.severity,
      tags: p.tags || []
    }))
  };
}

function parseUrlResponse(data) {
  const pulseCount = data.pulse_info?.count || 0;
  const threatScore = Math.min(pulseCount * 20, 100);

  return {
    scanned: true,
    threatScore,
    pulseCount,
    url: data.url || null,
    domain: data.domain || null,
    hostname: data.hostname || null,
    result: data.result || null,
    pulses: (data.pulse_info?.pulses || []).slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description?.substring(0, 300) || '',
      severity: p.severity,
      tags: p.tags || []
    }))
  };
}

function parseHashResponse(data) {
  const general = data.general || {};
  const analysis = data.analysis || {};

  const pulseCount = general.pulse_info?.count || 0;
  const threatScore = Math.min(pulseCount * 15, 100);

  return {
    scanned: true,
    threatScore,
    pulseCount,
    md5: general.md5 || null,
    sha1: general.sha1 || null,
    sha256: general.sha256 || null,
    fileType: general.file_type || null,
    fileName: general.file_name || null,
    fileSize: general.file_size || null,
    mimeType: analysis.mime_type || null,
    malwareFamily: analysis.malware_family || null,
    analysis: analysis.plugins || {},
    pulses: (general.pulse_info?.pulses || []).slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description?.substring(0, 300) || '',
      severity: p.severity,
      tags: p.tags || []
    }))
  };
}

module.exports = { lookupIP, lookupDomain, lookupURL, lookupHash, getPulses };


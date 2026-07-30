const axios = require('axios');
const logger = require('../utils/logger');

const THREATFOX_BASE = 'https://threatfox-api.abuse.ch/api/v1';
const MALWAREBAZAAR_BASE = 'https://mb-api.abuse.ch/api/v1';
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
 * Search ThreatFox for IOC data
 * @param {string} ioc - IOC value (IP, domain, URL, hash)
 * @returns {Object} ThreatFox results
 */
async function threatFoxSearch(ioc) {
  const cacheKey = `threatfox_${ioc}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(THREATFOX_BASE,
        {
          query: 'search_ioc',
          search_term: ioc
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: TIMEOUT
        }
      );

      const result = parseThreatFoxResponse(response.data);
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`ThreatFox search failed for IOC ${ioc}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Search MalwareBazaar for hash information
 * @param {string} hash - File hash (MD5/SHA1/SHA256)
 * @returns {Object} MalwareBazaar results
 */
async function malwareBazaarSearch(hash) {
  const cacheKey = `mblazaar_${hash}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(MALWAREBAZAAR_BASE,
        `query=get_info&hash=${hash}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: TIMEOUT
        }
      );

      const result = parseMalwareBazaarResponse(response.data);
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`MalwareBazaar search failed for hash ${hash}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Get recent malware from MalwareBazaar
 * @param {number} limit - Number of results
 * @returns {Object} Recent malware
 */
async function getRecentMalware(limit = 20) {
  try {
    const response = await axios.post(MALWAREBAZAAR_BASE,
      `query=get_recent&selector=time&limit=${limit}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: TIMEOUT
      }
    );

    return parseRecentMalwareResponse(response.data);
  } catch (error) {
    logger.error(`MalwareBazaar get recent failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get recent IOCs from ThreatFox
 * @param {number} limit - Number of results
 * @returns {Object} Recent IOCs
 */
async function getRecentIOCs(limit = 20) {
  try {
    const response = await axios.post(THREATFOX_BASE,
      {
        query: 'get_iocs',
        days: 1,
        limit
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: TIMEOUT
      }
    );

    return parseThreatFoxIOCResponse(response.data);
  } catch (error) {
    logger.error(`ThreatFox get recent IOCs failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseThreatFoxResponse(data) {
  if (data.query_status !== 'ok') {
    return { scanned: true, found: false, message: data.message || 'No results' };
  }

  const results = data.data || [];
  const threatScore = Math.min(results.length * 20, 100);

  return {
    scanned: true,
    found: results.length > 0,
    threatScore,
    count: results.length,
    iocs: results.map(r => ({
      id: r.id,
      ioc: r.ioc,
      threatType: r.threat_type,
      threatTypeDesc: r.threat_type_desc,
      malware: r.malware,
      malwarePrintable: r.malware_printable,
      confidenceLevel: r.confidence_level,
      firstSeen: r.first_seen,
      lastSeen: r.last_seen,
      anonymous: r.anonymous,
      reporter: r.reporter,
      reference: r.reference,
      tags: (r.tags || '').split(',').filter(Boolean),
      malwareFamilies: (r.malware_families || '').split(',').filter(Boolean)
    }))
  };
}

function parseMalwareBazaarResponse(data) {
  if (data.query_status !== 'ok') {
    return { scanned: true, found: false, message: data.data?.[0]?.md5_hash ? 'found' : 'not found' };
  }

  const samples = data.data || [];
  const threatScore = samples.length > 0 ? Math.min(samples.length * 25, 100) : 0;

  return {
    scanned: true,
    found: samples.length > 0,
    threatScore,
    count: samples.length,
    samples: samples.map(s => ({
      md5Hash: s.md5_hash,
      sha1Hash: s.sha1_hash,
      sha256Hash: s.sha256_hash,
      fileName: s.file_name,
      fileType: s.file_type,
      fileSize: s.file_size,
      signature: s.signature,
      tags: (s.tags || '').split(',').filter(Boolean),
      firstSeen: s.first_seen,
      lastSeen: s.last_seen,
      malwareFamily: s.malware_family,
      imphash: s.imphash,
      ssdeep: s.ssdeep,
      tlsH: s.tls_h,
      originCountry: s.origin_country,
      comment: s.comment,
      deliveryMethod: s.delivery_method,
      intelligence: s.intelligence ? {
        downloads: s.intelligence.downloads,
        uploads: s.intelligence.uploads,
        mail: s.intelligence.mail,
        malware: s.intelligence.malware
      } : null,
      vendorDetection: s.vendor_intel ? {
        total: s.vendor_intel.total_votes || 0,
        malicious: s.vendor_intel.malicious_votes || 0,
        score: s.vendor_intel.score || 0
      } : null
    }))
  };
}

function parseRecentMalwareResponse(data) {
  const samples = data.data || [];
  return {
    scanned: true,
    count: samples.length,
    samples: samples.map(s => ({
      sha256Hash: s.sha256_hash,
      fileName: s.file_name,
      signature: s.signature,
      fileType: s.file_type,
      fileSize: s.file_size,
      firstSeen: s.first_seen,
      tags: (s.tags || '').split(',').filter(Boolean)
    }))
  };
}

function parseThreatFoxIOCResponse(data) {
  const iocs = data.data || [];
  return {
    scanned: true,
    count: iocs.length,
    iocs: iocs.map(ioc => ({
      ioc: ioc.ioc,
      threatType: ioc.threat_type,
      malware: ioc.malware,
      confidenceLevel: ioc.confidence_level,
      firstSeen: ioc.first_seen
    }))
  };
}

module.exports = { threatFoxSearch, malwareBazaarSearch, getRecentMalware, getRecentIOCs };

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.abuseipdb.com/api/v2';
const TIMEOUT = 15000;
const MAX_RETRIES = 3;
const CACHE_TTL = 300000; // 5 minutes

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

/**
 * Check IP reputation via AbuseIPDB
 * @param {string} ip - IP address
 * @param {string} apiKey - AbuseIPDB API key
 * @returns {Object} IP reputation data
 */
async function checkIpReputation(ip, apiKey) {
  const cacheKey = `abuseip_${ip}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/check`, {
        params: {
          ipAddress: ip,
          maxAgeInDays: 90,
          verbose: true
        },
        headers: {
          'Key': apiKey,
          'Accept': 'application/json'
        },
        timeout: TIMEOUT
      });

      const result = parseResponse(response.data);
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 429) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        logger.warn(`AbuseIPDB rate limited. Retrying in ${waitTime}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(waitTime);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`AbuseIPDB check failed for IP ${ip}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Report an IP to AbuseIPDB
 * @param {string} ip - IP address to report
 * @param {string} categories - Abuse categories
 * @param {string} comment - Report comment
 * @param {string} apiKey - AbuseIPDB API key
 * @returns {Object} Report result
 */
async function reportIp(ip, categories, comment, apiKey) {
  try {
    const response = await axios.post(`${BASE_URL}/report`, {
      ip,
      categories,
      comment
    }, {
      headers: {
        'Key': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: TIMEOUT
    });

    return response.data;
  } catch (error) {
    logger.error(`AbuseIPDB report failed for IP ${ip}: ${error.message}`);
    return { error: error.message, reported: false };
  }
}

/**
 * Get blacklist data from AbuseIPDB
 * @param {string} apiKey - AbuseIPDB API key
 * @returns {Object} Blacklist data
 */
async function getBlacklist(apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/blacklist`, {
      params: {
        confidenceMinimum: 90,
        limit: 1000
      },
      headers: {
        'Key': apiKey,
        'Accept': 'application/json'
      },
      timeout: TIMEOUT
    });

    return response.data;
  } catch (error) {
    logger.error(`AbuseIPDB blacklist fetch failed: ${error.message}`);
    return { error: error.message };
  }
}

function parseResponse(data) {
  const ipData = data?.data || {};
  const totalReports = ipData.totalReports || 0;
  const abuseConfidenceScore = ipData.abuseConfidenceScore || 0;
  const lastReportedAt = ipData.lastReportedAt || null;

  let threatScore = 0;
  if (abuseConfidenceScore >= 75) threatScore = 80;
  else if (abuseConfidenceScore >= 50) threatScore = 60;
  else if (abuseConfidenceScore >= 25) threatScore = 40;
  else if (abuseConfidenceScore > 0) threatScore = 20;

  return {
    scanned: true,
    ip: ipData.ipAddress,
    abuseConfidenceScore,
    totalReports,
    lastReportedAt,
    threatScore,
    isPublic: ipData.isPublic,
    isWhitelisted: ipData.isWhitelisted,
    countryCode: ipData.countryCode,
    countryName: ipData.countryName,
    isp: ipData.isp,
    domain: ipData.domain,
    hostnames: ipData.hostnames || [],
    usageType: ipData.usageType,
    reports: (ipData.reports || []).slice(0, 10).map(r => ({
      reportedAt: r.reportedAt,
      comment: r.comment?.substring(0, 200) || '',
      categories: r.categories || [],
      reporterId: r.reporterId
    })),
    categories: ipData.reports?.reduce((acc, r) => {
      (r.categories || []).forEach(cat => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
      return acc;
    }, {}) || {}
  };
}

module.exports = { checkIpReputation, reportIp, getBlacklist };


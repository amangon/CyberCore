const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://ipinfo.io';
const TIMEOUT = 10000;
const MAX_RETRIES = 2;
const CACHE_TTL = 600000; // 10 minutes

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
 * Get IP geolocation and network data from IPinfo
 * @param {string} ip - IP address
 * @param {string} apiKey - IPinfo API key
 * @returns {Object} IP intelligence data
 */
async function lookupIP(ip, apiKey) {
  const cacheKey = `ipinfo_${ip}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const tokenParam = apiKey ? `?token=${apiKey}` : '';
      const response = await axios.get(`${BASE_URL}/${ip}${tokenParam}`, {
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
        logger.error(`IPinfo lookup failed for IP ${ip}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Lookup IP in bulk
 * @param {string[]} ips - Array of IP addresses
 * @param {string} apiKey - IPinfo API key
 * @returns {Object} Bulk lookup results
 */
async function bulkLookup(ips, apiKey) {
  try {
    const results = {};
    for (const ip of ips) {
      results[ip] = await lookupIP(ip, apiKey);
    }
    return {
      scanned: true,
      count: ips.length,
      results
    };
  } catch (error) {
    logger.error(`IPinfo bulk lookup failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get ASN information
 * @param {string} asn - ASN (e.g., AS15169)
 * @param {string} apiKey - IPinfo API key
 * @returns {Object} ASN details
 */
async function getASN(asn, apiKey) {
  try {
    const tokenParam = apiKey ? `?token=${apiKey}` : '';
    const response = await axios.get(`${BASE_URL}/${asn}/json${tokenParam}`, {
      timeout: TIMEOUT
    });

    return {
      scanned: true,
      asn: response.data.asn,
      name: response.data.name,
      country: response.data.country,
      domain: response.data.domain,
      type: response.data.type,
      numIps: response.data.num_ips,
      lastUpdate: response.data.last_update
    };
  } catch (error) {
    logger.error(`IPinfo ASN lookup failed for ${asn}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseResponse(data) {
  // Parse abuse contact data
  let abuseContact = null;
  if (data.abuse) {
    abuseContact = {
      address: data.abuse.address,
      country: data.abuse.country,
      email: data.abuse.email,
      name: data.abuse.name,
      network: data.abuse.network,
      phone: data.abuse.phone
    };
  }

  // Parse ASN info
  let asnInfo = null;
  if (data.asn) {
    asnInfo = {
      asn: data.asn.asn,
      name: data.asn.name,
      domain: data.asn.domain,
      route: data.asn.route,
      type: data.asn.type
    };
  }

  // Parse company info
  let companyInfo = null;
  if (data.company) {
    companyInfo = {
      name: data.company.name,
      domain: data.company.domain,
      type: data.company.type
    };
  }

  // Parse carrier info (for mobile IPs)
  let carrierInfo = null;
  if (data.carrier) {
    carrierInfo = {
      name: data.carrier.name,
      mcc: data.carrier.mcc,
      mnc: data.carrier.mnc
    };
  }

  // Determine proxy/VPN/Tor status
  const privacy = data.privacy || {};
  const threatScore = privacy.vpn ? 70 : privacy.proxy ? 60 : privacy.tor ? 80 : privacy.hosting ? 30 : 0;

  return {
    scanned: true,
    ip: data.ip,
    hostname: data.hostname || null,
    city: data.city,
    region: data.region,
    country: data.country,
    loc: data.loc,
    org: data.org,
    postal: data.postal,
    timezone: data.timezone,
    coordinates: data.loc ? {
      latitude: parseFloat(data.loc.split(',')[0]),
      longitude: parseFloat(data.loc.split(',')[1])
    } : null,
    asn: asnInfo,
    company: companyInfo,
    carrier: carrierInfo,
    abuse: abuseContact,
    privacy: {
      vpn: privacy.vpn || false,
      proxy: privacy.proxy || false,
      tor: privacy.tor || false,
      relay: privacy.relay || false,
      hosting: privacy.hosting || false,
      service: privacy.service || ''
    },
    domains: data.domains?.domains || [],
    threatScore
  };
}

module.exports = { lookupIP, bulkLookup, getASN };


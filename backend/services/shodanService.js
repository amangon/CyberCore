const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.shodan.io';
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

/**
 * Get host information from Shodan
 * @param {string} ip - IP address
 * @param {string} apiKey - Shodan API key
 * @returns {Object} Shodan host data
 */
async function getHostInfo(ip, apiKey) {
  const cacheKey = `shodan_host_${ip}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/shodan/host/${ip}`, {
        params: { key: apiKey },
        timeout: TIMEOUT
      });

      const result = parseHostResponse(response.data);
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`Shodan host lookup failed for IP ${ip}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Search Shodan for a query
 * @param {string} query - Search query
 * @param {string} apiKey - Shodan API key
 * @param {number} limit - Results limit
 * @returns {Object} Search results
 */
async function search(query, apiKey, limit = 10) {
  try {
    const response = await axios.get(`${BASE_URL}/shodan/host/search`, {
      params: {
        key: apiKey,
        query,
        limit
      },
      timeout: TIMEOUT
    });

    return {
      scanned: true,
      total: response.data.total || 0,
      matches: (response.data.matches || []).map(match => ({
        ip: match.ip_str,
        port: match.port,
        hostnames: match.hostnames || [],
        org: match.org,
        isp: match.isp,
        country: match.country_name,
        city: match.city,
        os: match.os,
        timestamp: match.timestamp,
        transport: match.transport,
        data: match.data?.substring(0, 500) || ''
      }))
    };
  } catch (error) {
    logger.error(`Shodan search failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get Shodan DNS resolution
 * @param {string} hostname - Hostname to resolve
 * @param {string} apiKey - Shodan API key
 * @returns {Object} DNS resolution
 */
async function dnsResolve(hostname, apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/dns/resolve`, {
      params: { key: apiKey, hostnames: hostname },
      timeout: TIMEOUT
    });

    return {
      scanned: true,
      hostname,
      ip: response.data[hostname] || null,
      resolved: !!response.data[hostname]
    };
  } catch (error) {
    logger.error(`Shodan DNS resolve failed for ${hostname}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get Shodan service banners
 * @param {string} ip - IP address
 * @param {string} apiKey - Shodan API key
 * @returns {Object} Service banners
 */
async function getServices(ip, apiKey) {
  const hostInfo = await getHostInfo(ip, apiKey);
  if (hostInfo.error) return hostInfo;

  return {
    scanned: true,
    ip,
    serviceCount: hostInfo.openPorts?.length || 0,
    services: hostInfo.openPorts || [],
    banners: hostInfo.banners || []
  };
}

function parseHostResponse(data) {
  const openPorts = (data.data || []).map(service => ({
    port: service.port,
    transport: service.transport,
    protocol: service._shodan?.module || null,
    product: service.product || null,
    version: service.version || null,
    os: service.os || null,
    hostnames: service.hostnames || [],
    banner: service.data?.substring(0, 1000) || '',
    timestamp: service.timestamp,
    ssl: service.ssl ? {
      versions: service.ssl.versions || [],
      cipher: service.ssl.cipher || null,
      cert: service.ssl.cert ? {
        subject: service.ssl.cert.subject,
        issuer: service.ssl.cert.issuer,
        issued: service.ssl.cert.issued,
        expires: service.ssl.cert.expires
      } : null
    } : null,
    http: service.http ? {
      title: service.http.title || null,
      server: service.http.server || null,
      robots: service.http.robots || null,
      securityTxt: service.http.security_txt || null
    } : null
  }));

  const uniquePorts = [...new Set(openPorts.map(s => s.port))];

  return {
    scanned: true,
    ip: data.ip_str,
    hostnames: data.hostnames || [],
    country: data.country_name,
    city: data.city,
    org: data.org,
    isp: data.isp,
    asn: data.asn,
    os: data.os || 'Unknown',
    latitude: data.latitude,
    longitude: data.longitude,
    lastUpdate: data.last_update,
    openPorts: openPorts,
    uniquePorts,
    portCount: uniquePorts.length,
    tags: data.tags || [],
    vulnerabilities: data.vulns ? Object.keys(data.vulns) : [],
    threatScore: Math.min(uniquePorts.length * 5 + (data.vulns ? Object.keys(data.vulns).length * 10 : 0), 100)
  };
}

module.exports = { getHostInfo, search, dnsResolve, getServices };


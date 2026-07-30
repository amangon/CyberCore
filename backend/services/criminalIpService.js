const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.criminalip.io/v1';
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
 * Get IP intelligence from Criminal IP
 * @param {string} ip - IP address
 * @param {string} apiKey - Criminal IP API key
 * @returns {Object} IP intelligence data
 */
async function getIPIntelligence(ip, apiKey) {
  const cacheKey = `criminalip_ip_${ip}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/feature/ip/${ip}`, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        },
        timeout: TIMEOUT
      });

      const result = parseIPResponse(response.data);
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`Criminal IP lookup failed for IP ${ip}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Get domain intelligence from Criminal IP
 * @param {string} domain - Domain name
 * @param {string} apiKey - Criminal IP API key
 * @returns {Object} Domain intelligence data
 */
async function getDomainIntelligence(domain, apiKey) {
  const cacheKey = `criminalip_domain_${domain}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/domain/domain/${domain}`, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        },
        timeout: TIMEOUT
      });

      const result = parseDomainResponse(response.data);
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`Criminal IP domain lookup failed for ${domain}: ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Check if an IP is a VPN/proxy via Criminal IP
 * @param {string} ip - IP address
 * @param {string} apiKey - Criminal IP API key
 * @returns {Object} VPN/proxy detection result
 */
async function checkVPN(ip, apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/feature/ip/${ip}`, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      },
      timeout: TIMEOUT
    });

    const data = response.data;
    return {
      scanned: true,
      ip,
      isVPN: data.is_vpn || false,
      isProxy: data.is_proxy || false,
      isTor: data.is_tor || false,
      isHosting: data.is_hosting || false,
      isDatacenter: data.is_datacenter || false,
      riskScore: data.risk_score || data.risk?.score || 0,
      threatScore: Math.min((data.risk_score || 0) * 10, 100)
    };
  } catch (error) {
    logger.error(`Criminal IP VPN check failed for ${ip}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get open ports from Criminal IP
 * @param {string} ip - IP address
 * @param {string} apiKey - Criminal IP API key
 * @returns {Object} Open ports data
 */
async function getOpenPorts(ip, apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/feature/ip/${ip}`, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      },
      timeout: TIMEOUT
    });

    const data = response.data;
    const ports = data.open_ports || data.ports || [];

    return {
      scanned: true,
      ip,
      portCount: ports.length,
      ports: ports.map(p => ({
        port: p.port || p,
        protocol: p.protocol || 'tcp',
        service: p.service || p.product || 'unknown',
        isHoneypot: p.is_honeypot || false
      })),
      threatScore: Math.min(ports.length * 5, 100)
    };
  } catch (error) {
    logger.error(`Criminal IP open ports check failed for ${ip}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get associated domains from Criminal IP
 * @param {string} ip - IP address
 * @param {string} apiKey - Criminal IP API key
 * @returns {Object} Associated domains
 */
async function getAssociatedDomains(ip, apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/feature/ip/${ip}`, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      },
      timeout: TIMEOUT
    });

    const data = response.data;
    const domains = data.associated_domains || data.domains || [];

    return {
      scanned: true,
      ip,
      domainCount: domains.length,
      domains: domains.slice(0, 50).map(d => ({
        domain: d.domain || d,
        firstSeen: d.first_seen || null,
        lastSeen: d.last_seen || null
      }))
    };
  } catch (error) {
    logger.error(`Criminal IP associated domains failed for ${ip}: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseIPResponse(data) {
  if (!data) {
    return { scanned: true, found: false };
  }

  const openPorts = (data.open_ports || data.ports || []).map(p => ({
    port: p.port || p,
    protocol: p.protocol || 'tcp',
    service: p.service || p.product || 'unknown',
    country: p.country || data.country || null,
    city: p.city || data.city || null,
    isHoneypot: p.is_honeypot || false,
    banner: p.banner ? p.banner.substring(0, 500) : null
  }));

  const associatedDomains = (data.associated_domains || data.domains || []).slice(0, 20).map(d => ({
    domain: d.domain || d,
    firstSeen: d.first_seen || null,
    lastSeen: d.last_seen || null
  }));

  const riskScore = data.risk_score || data.risk?.score || 0;
  const threatScore = Math.min(riskScore * 10, 100);

  return {
    scanned: true,
    found: true,
    ip: data.ip || data.ip_address,
    isVPN: data.is_vpn || false,
    isProxy: data.is_proxy || false,
    isTor: data.is_tor || false,
    isHosting: data.is_hosting || false,
    isDatacenter: data.is_datacenter || false,
    riskScore,
    threatScore,
    country: data.country || data.country_name || null,
    city: data.city || null,
    isp: data.isp || data.org || null,
    asn: data.asn || null,
    hostname: data.hostname || null,
    os: data.os || null,
    openPorts,
    portCount: openPorts.length,
    domains: associatedDomains,
    domainCount: associatedDomains.length,
    tags: data.tags || [],
    score: data.score || null,
    whois: data.whois ? {
      org: data.whois.org,
      country: data.whois.country,
      email: data.whois.email,
      name: data.whois.name
    } : null,
    scanHistory: (data.scan_history || []).slice(0, 10).map(h => ({
      date: h.date,
      port: h.port,
      service: h.service
    }))
  };
}

function parseDomainResponse(data) {
  if (!data) {
    return { scanned: true, found: false };
  }

  return {
    scanned: true,
    found: true,
    domain: data.domain,
    ip: data.ip_address || data.ip,
    country: data.country || null,
    isp: data.isp || null,
    asn: data.asn || null,
    isMalicious: data.is_malicious || false,
    riskScore: data.risk_score || 0,
    threatScore: Math.min((data.risk_score || 0) * 10, 100),
    dnsRecords: (data.dns_records || []).slice(0, 20).map(r => ({
      type: r.type,
      value: r.value,
      ttl: r.ttl
    })),
    whois: data.whois ? {
      registrar: data.whois.registrar,
      creationDate: data.whois.creation_date,
      expirationDate: data.whois.expiration_date,
      nameServers: data.whois.name_servers || []
    } : null,
    ssl: data.ssl ? {
      issuer: data.ssl.issuer,
      subject: data.ssl.subject,
      validFrom: data.ssl.valid_from,
      validTo: data.ssl.valid_to
    } : null,
    relatedDomains: (data.related_domains || []).slice(0, 20),
    tags: data.tags || []
  };
}

module.exports = {
  getIPIntelligence,
  getDomainIntelligence,
  checkVPN,
  getOpenPorts,
  getAssociatedDomains
};


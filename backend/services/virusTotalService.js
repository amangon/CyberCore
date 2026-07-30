const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

const BASE_URL = 'https://www.virustotal.com/api/v3';
const TIMEOUT = 30000;
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

async function makeRequest(url, apiKey, retries = MAX_RETRIES) {
  const cached = getCached(url);
  if (cached) return cached;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: { 'x-apikey': apiKey },
        timeout: TIMEOUT
      });
      setCache(url, response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        logger.warn(`VirusTotal rate limited. Retrying in ${waitTime}ms (attempt ${attempt}/${retries})`);
        await sleep(waitTime);
        continue;
      }
      if (attempt === retries) throw error;
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Scan a URL via VirusTotal
 * @param {string} url - The URL to scan
 * @param {string} apiKey - VirusTotal API key
 * @returns {Object} Scan results
 */
async function scanUrl(url, apiKey) {
  try {
    // First encode the URL and get analysis
    const encodedUrl = Buffer.from(url).toString('base64').replace(/=/g, '');
    const data = await makeRequest(`${BASE_URL}/urls/${encodedUrl}`, apiKey);
    return parseUrlResponse(data);
  } catch (error) {
    logger.error(`VirusTotal URL scan failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Scan a file hash via VirusTotal
 * @param {string} hash - SHA256/MD5/SHA1 hash
 * @param {string} apiKey - VirusTotal API key
 * @returns {Object} Scan results
 */
async function scanHash(hash, apiKey) {
  try {
    const data = await makeRequest(`${BASE_URL}/files/${hash}`, apiKey);
    return parseFileResponse(data);
  } catch (error) {
    logger.error(`VirusTotal hash scan failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Upload and scan a file via VirusTotal
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} apiKey - VirusTotal API key
 * @returns {Object} Scan results
 */
async function scanFile(fileBuffer, fileName, apiKey) {
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: fileName });

    const uploadResponse = await axios.post(`${BASE_URL}/files`, formData, {
      headers: {
        'x-apikey': apiKey,
        'Content-Type': 'multipart/form-data'
      },
      timeout: TIMEOUT
    });

    const analysisId = uploadResponse.data?.data?.id;
    if (!analysisId) throw new Error('Failed to get analysis ID');

    // Wait for analysis to complete
    await sleep(15000);

    const analysisData = await makeRequest(`${BASE_URL}/analyses/${analysisId}`, apiKey);
    return parseFileResponse(analysisData);
  } catch (error) {
    logger.error(`VirusTotal file scan failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Scan a domain via VirusTotal
 * @param {string} domain - Domain name
 * @param {string} apiKey - VirusTotal API key
 * @returns {Object} Scan results
 */
async function scanDomain(domain, apiKey) {
  try {
    const data = await makeRequest(`${BASE_URL}/domains/${domain}`, apiKey);
    return parseDomainResponse(data);
  } catch (error) {
    logger.error(`VirusTotal domain scan failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseUrlResponse(data) {
  const stats = data?.data?.attributes?.last_analysis_stats || {};
  const total = stats.harmless + stats.malicious + stats.suspicious + stats.undetected + stats.timeout || 1;
  const maliciousCount = (stats.malicious || 0) + (stats.suspicious || 0);
  const score = Math.round((maliciousCount / total) * 100);

  return {
    scanned: true,
    malicious: stats.malicious || 0,
    suspicious: stats.suspicious || 0,
    harmless: stats.harmless || 0,
    undetected: stats.undetected || 0,
    score,
    threatScore: score,
    categories: data?.data?.attributes?.categories || {},
    reputation: data?.data?.attributes?.reputation || 0,
    lastAnalysisDate: data?.data?.attributes?.last_analysis_date || null,
    link: data?.data?.links?.self || null
  };
}

function parseFileResponse(data) {
  const stats = data?.data?.attributes?.last_analysis_stats || {};
  const total = stats.harmless + stats.malicious + stats.suspicious + stats.undetected + stats.timeout || 1;
  const maliciousCount = (stats.malicious || 0) + (stats.suspicious || 0);
  const score = Math.round((maliciousCount / total) * 100);

  return {
    scanned: true,
    malicious: stats.malicious || 0,
    suspicious: stats.suspicious || 0,
    harmless: stats.harmless || 0,
    undetected: stats.undetected || 0,
    score,
    threatScore: score,
    type: data?.data?.attributes?.type_description || null,
    names: data?.data?.attributes?.names || [],
    signatures: data?.data?.attributes?.signature_info || {},
    lastAnalysisDate: data?.data?.attributes?.last_analysis_date || null,
    link: data?.data?.links?.self || null
  };
}

function parseDomainResponse(data) {
  const stats = data?.data?.attributes?.last_analysis_stats || {};
  const total = stats.harmless + stats.malicious + stats.suspicious + stats.undetected + stats.timeout || 1;
  const maliciousCount = (stats.malicious || 0) + (stats.suspicious || 0);
  const score = Math.round((maliciousCount / total) * 100);

  return {
    scanned: true,
    malicious: stats.malicious || 0,
    suspicious: stats.suspicious || 0,
    harmless: stats.harmless || 0,
    undetected: stats.undetected || 0,
    score,
    threatScore: score,
    categories: data?.data?.attributes?.categories || {},
    reputation: data?.data?.attributes?.reputation || 0,
    lastAnalysisDate: data?.data?.attributes?.last_analysis_date || null,
    link: data?.data?.links?.self || null
  };
}

module.exports = { scanUrl, scanHash, scanFile, scanDomain };


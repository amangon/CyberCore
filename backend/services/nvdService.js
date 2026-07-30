const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const TIMEOUT = 20000;
const MAX_RETRIES = 3;
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
 * Search for CVEs by keyword
 * @param {string} keyword - Search keyword
 * @param {string} apiKey - NVD API key (optional but recommended)
 * @param {number} limit - Results limit
 * @returns {Object} CVE search results
 */
async function searchCVE(keyword, apiKey, limit = 10) {
  const cacheKey = `nvd_search_${keyword}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const params = {
        keywordSearch: keyword,
        resultsPerPage: limit,
        startIndex: 0
      };
      if (apiKey) params.apiKey = apiKey;

      const response = await axios.get(BASE_URL, {
        params,
        timeout: TIMEOUT,
        headers: apiKey ? { apiKey } : {}
      });

      const result = parseSearchResponse(response.data);
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 429) {
        // NVD rate limits are strict (5 req / 30s without key, 50 req / 30s with key)
        await sleep(6000 * attempt);
        continue;
      }
      if (attempt === MAX_RETRIES) {
        logger.error(`NVD CVE search failed for "${keyword}": ${error.message}`);
        return { error: error.message, scanned: false };
      }
      await sleep(2000 * attempt);
    }
  }
}

/**
 * Get latest CVEs
 * @param {string} apiKey - NVD API key
 * @param {number} limit - Number of CVEs to fetch
 * @returns {Object} Latest CVEs
 */
async function getLatestCVE(apiKey, limit = 20) {
  const cacheKey = `nvd_latest_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const params = {
      resultsPerPage: limit,
      startIndex: 0
    };
    if (apiKey) params.apiKey = apiKey;

    const response = await axios.get(BASE_URL, {
      params,
      timeout: TIMEOUT,
      headers: apiKey ? { apiKey } : {}
    });

    const result = parseSearchResponse(response.data);
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`NVD get latest CVEs failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

/**
 * Get a specific CVE by ID
 * @param {string} cveId - CVE ID (e.g., CVE-2024-12345)
 * @param {string} apiKey - NVD API key
 * @returns {Object} CVE details
 */
async function getCVEById(cveId, apiKey) {
  const cacheKey = `nvd_cve_${cveId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const params = { cveId };
    if (apiKey) params.apiKey = apiKey;

    const response = await axios.get(BASE_URL, {
      params,
      timeout: TIMEOUT,
      headers: apiKey ? { apiKey } : {}
    });

    const cveData = response.data?.vulnerabilities?.[0]?.cve;
    if (!cveData) {
      return { scanned: true, found: false, cveId };
    }

    const result = parseCVEDetail(cveData);
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`NVD get CVE ${cveId} failed: ${error.message}`);
    return { error: error.message, scanned: false };
  }
}

function parseSearchResponse(data) {
  const vulnerabilities = data?.vulnerabilities || [];
  const totalResults = data?.totalResults || 0;

  return {
    scanned: true,
    totalResults,
    count: vulnerabilities.length,
    vulnerabilities: vulnerabilities.map(v => ({
      id: v.cve?.id,
      sourceIdentifier: v.cve?.sourceIdentifier,
      published: v.cve?.published,
      lastModified: v.cve?.lastModified,
      vulnStatus: v.cve?.vulnStatus,
      description: v.cve?.descriptions?.find(d => d.lang === 'en')?.value?.substring(0, 500) || '',
      severity: v.cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity ||
               v.cve?.metrics?.cvssMetricV30?.[0]?.cvssData?.baseSeverity ||
               v.cve?.metrics?.cvssMetricV2?.[0]?.baseSeverity || 'UNKNOWN',
      cvssScore: v.cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ||
                 v.cve?.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore ||
                 v.cve?.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || null,
      cvssVector: v.cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.vectorString ||
                  v.cve?.metrics?.cvssMetricV30?.[0]?.cvssData?.vectorString ||
                  v.cve?.metrics?.cvssMetricV2?.[0]?.cvssData?.vectorString || null,
      weaknesses: v.cve?.weaknesses?.map(w => w.description?.[0]?.value) || [],
      references: (v.cve?.references || []).slice(0, 10).map(r => r.url)
    }))
  };
}

function parseCVEDetail(cveData) {
  const metrics = cveData.metrics || {};
  const cvssV31 = metrics.cvssMetricV31?.[0]?.cvssData;
  const cvssV30 = metrics.cvssMetricV30?.[0]?.cvssData;
  const cvssV2 = metrics.cvssMetricV2?.[0]?.cvssData;
  const cvssData = cvssV31 || cvssV30 || cvssV2;

  return {
    scanned: true,
    found: true,
    id: cveData.id,
    sourceIdentifier: cveData.sourceIdentifier,
    published: cveData.published,
    lastModified: cveData.lastModified,
    vulnStatus: cveData.vulnStatus,
    description: cveData.descriptions?.find(d => d.lang === 'en')?.value || '',
    severity: cvssData?.baseSeverity || 'UNKNOWN',
    cvssScore: cvssData?.baseScore || null,
    cvssVector: cvssData?.vectorString || null,
    cvssVersion: cvssV31 ? '3.1' : cvssV30 ? '3.0' : cvssV2 ? '2.0' : null,
    attackVector: cvssData?.attackVector || null,
    attackComplexity: cvssData?.attackComplexity || null,
    privilegesRequired: cvssData?.privilegesRequired || null,
    userInteraction: cvssData?.userInteraction || null,
    scope: cvssData?.scope || null,
    confidentialityImpact: cvssData?.confidentialityImpact || null,
    integrityImpact: cvssData?.integrityImpact || null,
    availabilityImpact: cvssData?.availabilityImpact || null,
    weaknesses: cveData.weaknesses?.map(w => ({
      source: w.source,
      type: w.type,
      description: w.description?.[0]?.value
    })) || [],
    configurations: (cveData.configurations || []).slice(0, 10).map(c => ({
      nodes: c.nodes?.map(n => ({
        operator: n.operator,
        negate: n.negate,
        cpeMatch: n.cpeMatch?.map(m => ({
          criteria: m.criteria,
          matchCriteriaId: m.matchCriteriaId,
          vulnerable: m.vulnerable
        }))
      }))
    })),
    references: (cveData.references || []).slice(0, 20).map(r => r.url)
  };
}

module.exports = { searchCVE, getLatestCVE, getCVEById };


/**
 * Enterprise-grade provider runner for the SentinelX scan pipeline.
 *
 * Wraps every threat-intelligence provider with:
 *  - Independent execution (Promise.allSettled semantics)
 *  - Per-provider timeouts
 *  - Retry with exponential backoff (only for retryable statuses)
 *  - Normalized provider response format
 *  - Never throws; never exposes raw axios errors
 */

const logger = require('../utils/logger');

// ─── HTTP status → human-readable reason ─────────────────────────────────────
const STATUS_REASONS = {
  400: 'No Result',
  401: 'Authentication Failed',
  403: 'Forbidden',
  404: 'No Data',
  408: 'Timeout',
  429: 'Rate Limited',
  500: 'Provider Internal Error',
};

const RETRYABLE_STATUS = new Set([408, 429]);
const RETRYABLE_CODES = new Set(['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENETUNREACH', 'EPIPE']);

/**
 * Retry backoff (ms) per retry attempt. Maximum 2 retries (3 attempts total):
 * 500ms after the first failure, then 1000ms before the final attempt.
 */
const RETRY_BACKOFF = [500, 1000];

/** Default per-provider timeouts (ms), overridable per call. */
const DEFAULT_TIMEOUTS = {
  virustotal: 10000,
  threatfox: 8000,
  malwarebazaar: 8000,
  otx: 8000,
  cloudinary: 20000,
  shodan: 10000,
  abuseipdb: 8000,
  ipinfo: 8000,
  greynoise: 8000,
  criminalip: 8000,
  pulsedive: 8000,
  urlscan: 12000,
  googlesafebrowsing: 5000,
  nvd: 8000,
};

function providerTimeout(provider) {
  return DEFAULT_TIMEOUTS[provider] || 10000;
}

/**
 * Extract an HTTP status code embedded in an error message (e.g. axios
 * "Request failed with status code 401" after a service swallowed the raw
 * error and only preserved the message).
 */
function extractStatusFromMessage(message) {
  if (!message) return null;
  const match = String(message).match(/status code\s+(\d{3})/i);
  return match ? Number(match[1]) : null;
}

/**
 * Map an error to a normalized provider status.
 */
function mapError(error) {
  if (!error) return { status: 'unknown', reason: 'Unknown error' };

  const code = error.code;
  const status = error.response?.status || extractStatusFromMessage(error.message);

  if (status && STATUS_REASONS[status]) {
    return { status: String(status), reason: STATUS_REASONS[status], code: String(status) };
  }
  if (code && RETRYABLE_CODES.has(code)) {
    return { status: 'network', reason: 'Connection Failed', code };
  }
  if (!error.response && (code === 'ECONNABORTED' || /timeout/i.test(String(error.message || '')))) {
    return { status: '408', reason: 'Timeout', code: 'ECONNABORTED' };
  }
  if (status && status >= 500) {
    return { status: String(status), reason: 'Provider Internal Error', code: String(status) };
  }
  return { status: 'error', reason: error.message || 'Provider Error', code: code || 'ERR' };
}

/**
 * Some provider services (VirusTotal, Abuse.ch, OTX, Cloudinary) resolve with
 * an error-shaped object instead of throwing. Detect that so the runner treats
 * it as a real failure and status mapping stays accurate.
 */
function isErrorShapedPayload(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.error) return false;
  return (
    data.scanned === false ||
    data.success === false ||
    data.uploaded === false ||
    data.deleted === false
  );
}

/** Delay helper. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Attach a hard timeout to a promise. */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.code = 'ECONNABORTED';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Run a single provider with timeout + retry + normalization.
 *
 * @param {object} opts
 * @param {string}  opts.provider      - provider key (e.g. "virustotal")
 * @param {string}  opts.label         - human-readable provider name
 * @param {object}  opts.enabled       - whether the provider is configured
 * @param {boolean} opts.configError   - error describing why provider is disabled
 * @param {Function} opts.run          - async fn returning raw provider payload
 * @param {number}  [opts.timeoutMs]   - override provider timeout
 * @param {boolean} [opts.retry=true]  - whether to retry retryable statuses
 * @returns {Promise<object>} normalized provider result
 */
async function runProvider({
  provider,
  label,
  enabled = true,
  configError = '',
  run,
  timeoutMs,
  retry = true,
}) {
const startedAt = Date.now();
  let attempts = 0;
  let lastError = null;
  let lastStatus = null;

  const base = {
    provider,
    label: label || provider,
    available: Boolean(enabled),
    success: false,
    status: 'idle',
    verdict: 'unknown',
    confidence: 0,
    detections: 0,
    threatScore: 0,
    responseTime: 0,
    lastUpdated: null,
    error: null,
    data: null,
  };

  if (!enabled) {
    return {
      ...base,
      status: 'unavailable',
      error: configError || 'Not configured',
      responseTime: Date.now() - startedAt,
    };
  }

  const to = timeoutMs || providerTimeout(provider);
  const maxAttempts = retry ? 3 : 1;

  logger.info(`[provider] ${label} starting (provider=${provider}, timeout=${to}ms, maxAttempts=${maxAttempts})`);

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;
    const attemptStart = Date.now();
    try {
      const data = await withTimeout(run(), to, label);

      // If the provider resolved with an error-shaped payload (e.g.
      // { error, scanned: false }), treat it as a real failure.
      if (isErrorShapedPayload(data)) {
        const err = new Error(String(data.error));
        err.code = 'ERR_SWALLOWED';
        throw err;
      }

      const responseTime = Date.now() - startedAt;
      logger.info(
        `[provider] ${label} completed (provider=${provider}) ` +
        `attempt=${attempt} responseTime=${responseTime}ms ` +
        `httpStatus=200 retries=${attempt - 1} failureReason=none`
      );
      return {
        ...base,
        success: true,
        status: 'completed',
        responseTime,
        lastUpdated: new Date().toISOString(),
        data,
      };
    } catch (error) {
      lastError = error;
      const mapped = mapError(error);
      lastStatus = mapped.status;
      const retryable = RETRYABLE_STATUS.has(mapped.status) || mapped.status === 'network';
      const shouldRetry = retryable && attempt < maxAttempts;

      logger.warn(
        `[provider] ${label} failed (provider=${provider}) ` +
        `attempt=${attempt}/${maxAttempts} duration=${Date.now() - attemptStart}ms ` +
        `httpStatus=${mapped.status} retries=${attempt - 1} failureReason=${mapped.reason}`
      );

      if (shouldRetry) {
        const wait = RETRY_BACKOFF[attempt - 1] || 1000;
        logger.info(`[provider] ${label} retrying in ${wait}ms (attempt ${attempt + 1}/${maxAttempts})`);
        await sleep(wait);
        continue;
      }

      return {
        ...base,
        success: false,
        status: mapped.status,
        error: mapped.reason,
        responseTime: Date.now() - startedAt,
      };
    }
  }

  // Should not reach here, but safe fallback.
  return {
    ...base,
    success: false,
    status: lastStatus || 'error',
    error: lastError?.message || 'Provider failed',
    responseTime: Date.now() - startedAt,
  };
}

/**
 * Run multiple providers independently and normalize each result.
 * Never rejects; one failure never blocks others.
 *
 * @param {Array<{provider,label,enabled,configError,run,timeoutMs,retry}>} specs
 * @returns {Promise<Array<object>>} normalized provider results
 */
async function runProviders(specs) {
  const settled = await Promise.allSettled(specs.map((spec) => runProvider(spec)));
  return settled.map((entry, i) => {
    const spec = specs[i];
    if (entry.status === 'fulfilled') return entry.value;
    // runProvider never throws, but guard anyway.
    return {
      provider: spec.provider,
      label: spec.label || spec.provider,
      available: Boolean(spec.enabled),
      success: false,
      status: 'error',
      verdict: 'unknown',
      confidence: 0,
      detections: 0,
      threatScore: 0,
      responseTime: 0,
      lastUpdated: null,
      error: 'Unexpected error',
      data: null,
    };
  });
}

module.exports = {
  runProvider,
  runProviders,
  withTimeout,
  mapError,
  STATUS_REASONS,
  RETRYABLE_STATUS,
  RETRYABLE_CODES,
};

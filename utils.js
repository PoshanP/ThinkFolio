// Utility functions

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function greet(name) {
  return `Hello, ${name}!`;
}

// =============================================================================
// API TOKEN VALIDATION UTILITIES
// =============================================================================

/**
 * Validates if a string looks like a valid API key format
 * @param {string} token - The token to validate
 * @param {string} provider - The provider name (e.g., 'openai', 'stripe', 'anthropic')
 * @returns {object} - Object with isValid boolean and error message
 */
function validateTokenFormat(token, provider) {
  if (!token || typeof token !== 'string') {
    return {
      isValid: false,
      error: 'Token is required and must be a string',
    };
  }

  const validators = {
    openai: /^sk-[a-zA-Z0-9]{20,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-]{20,}$/,
    stripe: /^(sk|pk)_(test|live)_[a-zA-Z0-9]{24,}$/,
    supabase: /^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
    sendgrid: /^SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}$/,
    aws: /^AKIA[0-9A-Z]{16}$/,
    twilio: /^AC[a-z0-9]{32}$/,
    mixpanel: /^[a-z0-9]{32}$/,
    github: /^gh[ps]_[a-zA-Z0-9]{36,}$/,
  };

  const providerLower = provider.toLowerCase();
  const regex = validators[providerLower];

  if (!regex) {
    // If no specific validator, check general format
    if (token.length < 10) {
      return {
        isValid: false,
        error: `Token appears too short (${token.length} characters)`,
      };
    }
    return {
      isValid: true,
      warning: `No specific validator for provider: ${provider}`,
    };
  }

  const isValid = regex.test(token);
  return {
    isValid,
    error: isValid ? null : `Token does not match expected format for ${provider}`,
  };
}

/**
 * Checks if a token is expired (for JWT tokens)
 * @param {string} token - The JWT token to check
 * @returns {object} - Object with isExpired boolean, expiresAt date, and error
 */
function isTokenExpired(token) {
  try {
    // JWT tokens have three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        isExpired: null,
        error: 'Not a valid JWT token format',
      };
    }

    // Decode the payload (second part)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    if (!payload.exp) {
      return {
        isExpired: false,
        error: 'Token does not have an expiration date',
      };
    }

    const expiresAt = new Date(payload.exp * 1000);
    const now = new Date();

    return {
      isExpired: now > expiresAt,
      expiresAt,
      error: null,
    };
  } catch (error) {
    return {
      isExpired: null,
      error: `Failed to decode token: ${error.message}`,
    };
  }
}

/**
 * Extracts information from a JWT token without verification
 * @param {string} token - The JWT token
 * @returns {object} - Decoded payload or error
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        success: false,
        error: 'Invalid JWT format',
      };
    }

    const header = JSON.parse(
      Buffer.from(parts[0], 'base64').toString('utf-8')
    );
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return {
      success: true,
      header,
      payload,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to decode JWT: ${error.message}`,
    };
  }
}

/**
 * Sanitizes a token for logging (shows only first and last few characters)
 * @param {string} token - The token to sanitize
 * @param {number} visibleChars - Number of characters to show at start/end (default: 4)
 * @returns {string} - Sanitized token
 */
function sanitizeToken(token, visibleChars = 4) {
  if (!token || typeof token !== 'string') {
    return '(invalid)';
  }

  if (token.length <= visibleChars * 2) {
    return '*'.repeat(token.length);
  }

  return `${token.substring(0, visibleChars)}${'*'.repeat(
    Math.min(token.length - visibleChars * 2, 20)
  )}${token.substring(token.length - visibleChars)}`;
}

/**
 * Detects the provider type from a token format
 * @param {string} token - The token to analyze
 * @returns {string|null} - Detected provider name or null
 */
function detectTokenProvider(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const patterns = [
    { pattern: /^sk-[a-zA-Z0-9]{20,}$/, provider: 'openai' },
    { pattern: /^sk-ant-/, provider: 'anthropic' },
    { pattern: /^(sk|pk)_(test|live)_/, provider: 'stripe' },
    { pattern: /^eyJ[a-zA-Z0-9_-]+\.eyJ/, provider: 'jwt' },
    { pattern: /^SG\./, provider: 'sendgrid' },
    { pattern: /^AKIA[0-9A-Z]{16}$/, provider: 'aws' },
    { pattern: /^AC[a-z0-9]{32}$/, provider: 'twilio' },
    { pattern: /^gh[ps]_/, provider: 'github' },
    { pattern: /^xox[bpao]-/, provider: 'slack' },
    { pattern: /^Bearer /, provider: 'bearer' },
  ];

  for (const { pattern, provider } of patterns) {
    if (pattern.test(token)) {
      return provider;
    }
  }

  return 'unknown';
}

/**
 * Validates multiple tokens at once
 * @param {object} tokens - Object with provider names as keys and tokens as values
 * @returns {object} - Validation results for each token
 */
function validateTokens(tokens) {
  const results = {};

  for (const [provider, token] of Object.entries(tokens)) {
    results[provider] = validateTokenFormat(token, provider);
  }

  return results;
}

/**
 * Checks if an environment has all required tokens configured
 * @param {string[]} requiredProviders - Array of required provider names
 * @param {object} envConfig - Configuration object (defaults to process.env)
 * @returns {object} - Object with isComplete boolean and missing providers array
 */
function checkRequiredTokens(requiredProviders, envConfig = process.env) {
  const missing = [];
  const tokenMap = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    stripe: 'STRIPE_SECRET_KEY',
    supabase: 'SUPABASE_SERVICE_ROLE_KEY',
    sendgrid: 'SENDGRID_API_KEY',
    aws: 'AWS_ACCESS_KEY_ID',
    gcp: 'GCP_PROJECT_ID',
    twilio: 'TWILIO_AUTH_TOKEN',
  };

  for (const provider of requiredProviders) {
    const envVar = tokenMap[provider.toLowerCase()];
    if (!envVar || !envConfig[envVar]) {
      missing.push(provider);
    }
  }

  return {
    isComplete: missing.length === 0,
    missing,
  };
}

/**
 * Generates a mock token for testing (DO NOT USE IN PRODUCTION)
 * @param {string} provider - The provider name
 * @returns {string} - A mock token
 */
function generateMockToken(provider) {
  const generators = {
    openai: () => `sk-test${randomString(48)}`,
    anthropic: () => `sk-ant-test${randomString(40)}`,
    stripe: () => `sk_test_${randomString(24)}`,
    supabase: () => `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0IiwiZXhwIjoxOTk5OTk5OTk5fQ.test`,
    sendgrid: () => `SG.${randomString(22)}.${randomString(43)}`,
  };

  const generator = generators[provider.toLowerCase()];
  return generator ? generator() : `mock_${provider}_${randomString(32)}`;
}

/**
 * Generates a random alphanumeric string
 * @param {number} length - The length of the string
 * @returns {string} - Random string
 */
function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  getRandomNumber,
  greet,
  // Token validation utilities
  validateTokenFormat,
  isTokenExpired,
  decodeJWT,
  sanitizeToken,
  detectTokenProvider,
  validateTokens,
  checkRequiredTokens,
  generateMockToken,
};

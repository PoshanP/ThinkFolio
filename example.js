#!/usr/bin/env node

/**
 * Example usage of the API Token Management System
 *
 * This file demonstrates various features of the token management system:
 * - Loading configuration
 * - Validating tokens
 * - Checking service availability
 * - Safe logging practices
 *
 * Run with: node example.js
 */

const {
  config,
  validateConfig,
  getServiceConfig,
  isServiceConfigured,
  getActiveAIProvider,
  getSanitizedConfig,
} = require('./config');

const {
  validateTokenFormat,
  isTokenExpired,
  decodeJWT,
  sanitizeToken,
  detectTokenProvider,
  validateTokens,
  checkRequiredTokens,
  generateMockToken,
} = require('./utils');

console.log('='.repeat(70));
console.log('API TOKEN MANAGEMENT SYSTEM - EXAMPLES');
console.log('='.repeat(70));
console.log();

// =============================================================================
// Example 1: Check Environment Configuration
// =============================================================================
console.log('1. ENVIRONMENT CONFIGURATION');
console.log('-'.repeat(70));
console.log(`Environment: ${config.env}`);
console.log(`App URL: ${config.appUrl}`);
console.log();

// =============================================================================
// Example 2: Check Which Services Are Configured
// =============================================================================
console.log('2. CONFIGURED SERVICES');
console.log('-'.repeat(70));

const servicesToCheck = [
  'openai',
  'anthropic',
  'stripe',
  'sendgrid',
  'supabase',
  'aws',
  'gcp',
  'twilio',
  'slack',
];

for (const service of servicesToCheck) {
  const isConfigured = isServiceConfigured(service);
  const status = isConfigured ? '✓' : '✗';
  console.log(`${status} ${service.padEnd(15)} ${isConfigured ? 'Configured' : 'Not configured'}`);
}
console.log();

// =============================================================================
// Example 3: Get Active AI Provider
// =============================================================================
console.log('3. ACTIVE AI PROVIDER');
console.log('-'.repeat(70));

const aiProvider = getActiveAIProvider();
console.log(`Provider: ${aiProvider.name}`);

if (aiProvider.name === 'openai' && aiProvider.config.apiKey) {
  console.log(`Model: ${aiProvider.config.model}`);
  console.log(`Embedding Model: ${aiProvider.config.embeddingModel}`);
  console.log(`API Key: ${sanitizeToken(aiProvider.config.apiKey)}`);
} else if (aiProvider.name === 'anthropic' && aiProvider.config.apiKey) {
  console.log(`Model: ${aiProvider.config.model}`);
  console.log(`Max Tokens: ${aiProvider.config.maxTokens}`);
  console.log(`API Key: ${sanitizeToken(aiProvider.config.apiKey)}`);
} else {
  console.log('No AI provider configured');
}
console.log();

// =============================================================================
// Example 4: Validate Token Formats
// =============================================================================
console.log('4. TOKEN FORMAT VALIDATION');
console.log('-'.repeat(70));

// Generate some mock tokens for demonstration
const mockTokens = {
  openai: generateMockToken('openai'),
  anthropic: generateMockToken('anthropic'),
  stripe: generateMockToken('stripe'),
  invalid: 'invalid-token-123',
};

console.log('Testing token formats:');
for (const [provider, token] of Object.entries(mockTokens)) {
  const validation = validateTokenFormat(token, provider);
  const status = validation.isValid ? '✓' : '✗';
  console.log(`${status} ${provider.padEnd(15)} ${sanitizeToken(token)}`);
  if (!validation.isValid) {
    console.log(`   Error: ${validation.error}`);
  }
}
console.log();

// =============================================================================
// Example 5: Detect Token Provider
// =============================================================================
console.log('5. AUTO-DETECT TOKEN PROVIDER');
console.log('-'.repeat(70));

const testTokens = [
  'sk-abc123def456ghi789',
  'sk-ant-api03-test123',
  'sk_test_abc123def456',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0IjoidmFsdWUifQ.test',
  'SG.abc123def456.xyz789',
];

for (const token of testTokens) {
  const provider = detectTokenProvider(token);
  console.log(`${sanitizeToken(token, 8).padEnd(30)} → ${provider}`);
}
console.log();

// =============================================================================
// Example 6: JWT Token Analysis
// =============================================================================
console.log('6. JWT TOKEN ANALYSIS');
console.log('-'.repeat(70));

// Create a mock JWT for demonstration
const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0Iiwic3ViIjoidXNlcjEyMyIsImV4cCI6MTk5OTk5OTk5OX0.test';

const decoded = decodeJWT(mockJWT);
if (decoded.success) {
  console.log('JWT Header:', JSON.stringify(decoded.header, null, 2));
  console.log('JWT Payload:', JSON.stringify(decoded.payload, null, 2));

  const expiration = isTokenExpired(mockJWT);
  if (expiration.error) {
    console.log(`Expiration check: ${expiration.error}`);
  } else {
    console.log(`Is expired: ${expiration.isExpired}`);
    if (expiration.expiresAt) {
      console.log(`Expires at: ${expiration.expiresAt.toISOString()}`);
    }
  }
} else {
  console.log(`Failed to decode JWT: ${decoded.error}`);
}
console.log();

// =============================================================================
// Example 7: Check Required Tokens
// =============================================================================
console.log('7. REQUIRED TOKENS CHECK');
console.log('-'.repeat(70));

// Define which services are required for this application
const requiredServices = ['openai', 'stripe'];

const requiredCheck = checkRequiredTokens(requiredServices);
if (requiredCheck.isComplete) {
  console.log('✓ All required tokens are configured');
} else {
  console.log('✗ Missing required tokens:');
  for (const missing of requiredCheck.missing) {
    console.log(`   - ${missing}`);
  }
}
console.log();

// =============================================================================
// Example 8: Validate Specific Config Paths
// =============================================================================
console.log('8. CONFIGURATION PATH VALIDATION');
console.log('-'.repeat(70));

const requiredPaths = [
  'ai.openai.apiKey',
  'ai.openai.model',
  'payment.stripe.secretKey',
];

const configValidation = validateConfig(requiredPaths);
if (configValidation.isValid) {
  console.log('✓ All required configuration paths are set');
} else {
  console.log('✗ Missing configuration:');
  for (const missing of configValidation.missing) {
    console.log(`   - ${missing}`);
  }
}
console.log();

// =============================================================================
// Example 9: Get Service-Specific Configuration
// =============================================================================
console.log('9. SERVICE-SPECIFIC CONFIGURATION');
console.log('-'.repeat(70));

const stripeConfig = getServiceConfig('stripe');
if (stripeConfig && stripeConfig.secretKey) {
  console.log('Stripe Configuration:');
  console.log(`  Publishable Key: ${sanitizeToken(stripeConfig.publishableKey)}`);
  console.log(`  Secret Key: ${sanitizeToken(stripeConfig.secretKey)}`);
  console.log(`  Webhook Secret: ${stripeConfig.webhookSecret ? sanitizeToken(stripeConfig.webhookSecret) : 'Not set'}`);
} else {
  console.log('Stripe is not configured');
}
console.log();

// =============================================================================
// Example 10: Safe Configuration Logging
// =============================================================================
console.log('10. SAFE CONFIGURATION LOGGING');
console.log('-'.repeat(70));

// This is safe to log - all sensitive values are masked
const safeConfig = getSanitizedConfig();
console.log('Sanitized configuration (safe for logs):');
console.log(JSON.stringify(safeConfig, null, 2));
console.log();

// =============================================================================
// Example 11: Using Original Utils Functions
// =============================================================================
console.log('11. ORIGINAL UTILITY FUNCTIONS');
console.log('-'.repeat(70));

const { getRandomNumber, greet } = require('./utils');

console.log(`Random number (1-100): ${getRandomNumber(1, 100)}`);
console.log(greet('API Token Manager'));
console.log();

// =============================================================================
// Summary and Best Practices
// =============================================================================
console.log('='.repeat(70));
console.log('BEST PRACTICES REMINDER');
console.log('='.repeat(70));
console.log('✓ Always use .env.local for sensitive tokens');
console.log('✓ Never commit .env.local to version control');
console.log('✓ Use sanitizeToken() when logging tokens');
console.log('✓ Validate tokens before using them');
console.log('✓ Rotate tokens regularly');
console.log('✓ Use different tokens for dev/staging/production');
console.log('✓ Check service configuration before making API calls');
console.log('='.repeat(70));
console.log();

// Exit with appropriate code
if (!requiredCheck.isComplete || !configValidation.isValid) {
  console.log('⚠️  Some required configuration is missing. See above for details.');
  console.log('📝 Copy .env.example to .env.local and fill in your API keys.');
  process.exit(1);
} else {
  console.log('✅ All systems ready!');
  process.exit(0);
}

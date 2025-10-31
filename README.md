# API Token Management System

A comprehensive system for managing API tokens and credentials for multiple services including Anthropic Claude, Google Cloud Platform, AWS, and various third-party services.

## Table of Contents

- [Quick Start](#quick-start)
- [Supported Services](#supported-services)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Token Validation](#token-validation)
- [Security Best Practices](#security-best-practices)
- [API Reference](#api-reference)

## Quick Start

### 1. Setup Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your actual API keys
# NEVER commit .env.local to version control!
```

### 2. Install Dependencies

```bash
npm install dotenv
```

### 3. Use in Your Code

```javascript
const { config, getServiceConfig, validateTokenFormat } = require('./config');
const { sanitizeToken, detectTokenProvider } = require('./utils');

// Get configuration for a specific service
const openaiConfig = getServiceConfig('openai');
console.log('OpenAI Model:', openaiConfig.model);

// Validate a token format
const validation = validateTokenFormat('sk-...', 'openai');
if (!validation.isValid) {
  console.error('Invalid token:', validation.error);
}

// Safely log tokens (masked)
console.log('Token:', sanitizeToken(myToken));
```

## Supported Services

### AI Providers
- **OpenAI** - GPT-4, embeddings, and other models
- **Anthropic** - Claude 3.5 Sonnet and other Claude models

### Cloud Providers
- **Google Cloud Platform (GCP)**
  - Cloud Storage
  - Vision API
  - Document AI
- **Amazon Web Services (AWS)**
  - S3 Storage
  - Lambda Functions
  - SES Email Service

### Payment Processing
- **Stripe** - Payment processing and subscriptions
- **PayPal** - Alternative payment processing

### Email Services
- **SendGrid** - Transactional emails
- **Resend** - Modern email API
- **AWS SES** - Amazon's email service

### Analytics & Monitoring
- **Mixpanel** - Product analytics
- **Segment** - Customer data platform
- **PostHog** - Product analytics and feature flags
- **Google Analytics** - Web analytics
- **Sentry** - Error tracking and monitoring

### Communication
- **Twilio** - SMS and voice
- **Slack** - Team messaging integration
- **Discord** - Community chat integration

### Storage & CDN
- **Cloudflare** - CDN and edge computing
- **Vercel Blob** - File storage
- **Uploadthing** - File upload service

### Search & Indexing
- **Algolia** - Search as a service
- **Meilisearch** - Open-source search engine

### Vector Databases
- **Pinecone** - Managed vector database
- **Weaviate** - Open-source vector database
- **Chroma** - AI-native embedding database

### Authentication
- **Auth0** - Authentication and authorization
- **Clerk** - User management and authentication
- **OAuth** - Google, GitHub, and other providers

### Databases
- **Redis** - In-memory data store
- **MongoDB** - NoSQL database
- **PostgreSQL** - Relational database
- **Upstash** - Serverless Redis

## Configuration

### Environment Variables Structure

The system uses a hierarchical structure for configuration:

```
AI Providers
├── OpenAI (OPENAI_API_KEY, OPENAI_MODEL, etc.)
└── Anthropic (ANTHROPIC_API_KEY, ANTHROPIC_MODEL, etc.)

Cloud Providers
├── GCP (GCP_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS, etc.)
└── AWS (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.)

Services
├── Payment (Stripe, PayPal)
├── Email (SendGrid, Resend, AWS SES)
├── Analytics (Mixpanel, Segment, PostHog)
└── ... (see .env.example for complete list)
```

### Selecting AI Provider

By default, the system uses OpenAI. To switch to Anthropic Claude:

```bash
# In .env.local
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then in your code:

```javascript
const { getActiveAIProvider } = require('./config');

const aiProvider = getActiveAIProvider();
console.log('Using:', aiProvider.name); // 'anthropic'
console.log('Config:', aiProvider.config);
```

## Usage Examples

### Example 1: Validate Required Tokens

```javascript
const { checkRequiredTokens } = require('./utils');
const { validateConfig } = require('./config');

// Check if required services are configured
const required = ['openai', 'stripe', 'sendgrid'];
const result = checkRequiredTokens(required);

if (!result.isComplete) {
  console.error('Missing tokens for:', result.missing);
  process.exit(1);
}

// Or validate specific config paths
const validation = validateConfig([
  'ai.openai.apiKey',
  'payment.stripe.secretKey',
  'email.sendgrid.apiKey'
]);

if (!validation.isValid) {
  console.error('Missing configuration:', validation.missing);
}
```

### Example 2: Detect and Validate Unknown Token

```javascript
const { detectTokenProvider, validateTokenFormat } = require('./utils');

const unknownToken = 'sk-ant-api03-xxx...';

// Detect the provider
const provider = detectTokenProvider(unknownToken);
console.log('Detected provider:', provider); // 'anthropic'

// Validate the format
const validation = validateTokenFormat(unknownToken, provider);
if (validation.isValid) {
  console.log('Token format is valid');
} else {
  console.error('Invalid token:', validation.error);
}
```

### Example 3: Check JWT Token Expiration

```javascript
const { isTokenExpired, decodeJWT } = require('./utils');

const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Check if expired
const expiration = isTokenExpired(jwtToken);
if (expiration.isExpired) {
  console.error('Token expired on:', expiration.expiresAt);
} else {
  console.log('Token is still valid');
}

// Decode to inspect payload
const decoded = decodeJWT(jwtToken);
if (decoded.success) {
  console.log('Token payload:', decoded.payload);
  console.log('Token header:', decoded.header);
}
```

### Example 4: Check Service Configuration

```javascript
const { isServiceConfigured, getServiceConfig } = require('./config');

// Check if a service is configured
if (isServiceConfigured('stripe')) {
  const stripeConfig = getServiceConfig('stripe');
  console.log('Stripe is configured');
  console.log('Using publishable key:', stripeConfig.publishableKey);
} else {
  console.log('Stripe is not configured');
}
```

### Example 5: Safely Log Configuration

```javascript
const { getSanitizedConfig } = require('./config');

// Get a version of config safe for logging
const safeConfig = getSanitizedConfig();
console.log('Current configuration:', JSON.stringify(safeConfig, null, 2));
// Output will have API keys masked like: "sk-****...1234"
```

### Example 6: Validate Multiple Tokens at Once

```javascript
const { validateTokens } = require('./utils');

const tokens = {
  openai: process.env.OPENAI_API_KEY,
  stripe: process.env.STRIPE_SECRET_KEY,
  sendgrid: process.env.SENDGRID_API_KEY,
};

const results = validateTokens(tokens);

for (const [service, result] of Object.entries(results)) {
  if (result.isValid) {
    console.log(`✓ ${service} token is valid`);
  } else {
    console.error(`✗ ${service} token is invalid: ${result.error}`);
  }
}
```

## Token Validation

The system includes format validation for common API token formats:

| Provider | Format Pattern | Example |
|----------|---------------|---------|
| OpenAI | `sk-[a-zA-Z0-9]{20,}` | `sk-abc123...` |
| Anthropic | `sk-ant-[a-zA-Z0-9-]{20,}` | `sk-ant-api03-...` |
| Stripe | `(sk\|pk)_(test\|live)_[a-zA-Z0-9]{24,}` | `sk_test_abc123...` |
| Supabase | JWT format (3 base64 parts) | `eyJ...` |
| SendGrid | `SG.[a-zA-Z0-9_-]{22}.[a-zA-Z0-9_-]{43}` | `SG.abc...def` |
| AWS | `AKIA[0-9A-Z]{16}` | `AKIAIOSFODNN7EXAMPLE` |
| Twilio | `AC[a-z0-9]{32}` | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| GitHub | `gh[ps]_[a-zA-Z0-9]{36,}` | `ghp_abc123...` |

## Security Best Practices

### DO ✓

1. **Use .env.local for sensitive tokens**
   ```bash
   # Always keep tokens in .env.local
   OPENAI_API_KEY=sk-your-real-key-here
   ```

2. **Never commit .env.local**
   ```bash
   # Already in .gitignore
   git status # Should not show .env.local
   ```

3. **Use different tokens for different environments**
   ```bash
   # Development
   STRIPE_SECRET_KEY=sk_test_...

   # Production
   STRIPE_SECRET_KEY=sk_live_...
   ```

4. **Rotate tokens regularly**
   - Regenerate tokens every 90 days
   - Immediately rotate if compromised

5. **Validate tokens before use**
   ```javascript
   const validation = validateTokenFormat(token, 'openai');
   if (!validation.isValid) {
     throw new Error(validation.error);
   }
   ```

6. **Use masked tokens in logs**
   ```javascript
   console.log('Token:', sanitizeToken(apiKey));
   // Output: sk-****...1234
   ```

### DON'T ✗

1. **Never hardcode tokens in code**
   ```javascript
   // ✗ BAD
   const apiKey = 'sk-abc123...';

   // ✓ GOOD
   const apiKey = process.env.OPENAI_API_KEY;
   ```

2. **Never commit tokens to git**
   ```bash
   # ✗ BAD
   git add .env.local
   ```

3. **Never log full tokens**
   ```javascript
   // ✗ BAD
   console.log('API Key:', apiKey);

   // ✓ GOOD
   console.log('API Key:', sanitizeToken(apiKey));
   ```

4. **Never expose tokens to client-side**
   ```javascript
   // ✗ BAD - Server-only tokens
   const config = {
     openaiKey: process.env.OPENAI_API_KEY, // Exposed to browser!
   };

   // ✓ GOOD - Only public tokens
   const config = {
     stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
   };
   ```

5. **Never use production tokens in development**
   ```bash
   # ✗ BAD
   STRIPE_SECRET_KEY=sk_live_... # In development!

   # ✓ GOOD
   STRIPE_SECRET_KEY=sk_test_... # Use test keys in dev
   ```

## API Reference

### config.js

#### `config`
The main configuration object containing all API tokens and settings.

#### `validateConfig(requiredKeys)`
Validates that required configuration values are present.
- **Parameters:**
  - `requiredKeys` (string[]): Array of config keys in dot notation
- **Returns:** `{isValid: boolean, missing: string[]}`

#### `getServiceConfig(service)`
Gets configuration for a specific service.
- **Parameters:**
  - `service` (string): Service name (e.g., 'openai', 'stripe')
- **Returns:** Service configuration object or null

#### `isServiceConfigured(service)`
Checks if a service has any configuration.
- **Parameters:**
  - `service` (string): Service name
- **Returns:** boolean

#### `getActiveAIProvider()`
Gets the currently active AI provider configuration.
- **Returns:** `{name: string, config: object}`

#### `getSanitizedConfig()`
Gets configuration with sensitive values masked for logging.
- **Returns:** Sanitized configuration object

### utils.js

#### `validateTokenFormat(token, provider)`
Validates if a token matches the expected format for a provider.
- **Parameters:**
  - `token` (string): The token to validate
  - `provider` (string): Provider name
- **Returns:** `{isValid: boolean, error: string|null}`

#### `isTokenExpired(token)`
Checks if a JWT token is expired.
- **Parameters:**
  - `token` (string): JWT token
- **Returns:** `{isExpired: boolean, expiresAt: Date, error: string|null}`

#### `decodeJWT(token)`
Decodes a JWT token without verification.
- **Parameters:**
  - `token` (string): JWT token
- **Returns:** `{success: boolean, header: object, payload: object, error: string}`

#### `sanitizeToken(token, visibleChars = 4)`
Masks a token for safe logging.
- **Parameters:**
  - `token` (string): Token to sanitize
  - `visibleChars` (number): Characters to show at start/end
- **Returns:** Sanitized string

#### `detectTokenProvider(token)`
Detects the provider from a token's format.
- **Parameters:**
  - `token` (string): Token to analyze
- **Returns:** Provider name (string) or null

#### `validateTokens(tokens)`
Validates multiple tokens at once.
- **Parameters:**
  - `tokens` (object): Object with provider names as keys and tokens as values
- **Returns:** Object with validation results for each token

#### `checkRequiredTokens(requiredProviders, envConfig)`
Checks if required tokens are configured.
- **Parameters:**
  - `requiredProviders` (string[]): Array of provider names
  - `envConfig` (object): Config object (defaults to process.env)
- **Returns:** `{isComplete: boolean, missing: string[]}`

#### `generateMockToken(provider)`
Generates a mock token for testing (NOT for production).
- **Parameters:**
  - `provider` (string): Provider name
- **Returns:** Mock token string

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API Documentation](https://docs.anthropic.com)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [AWS Documentation](https://docs.aws.amazon.com)
- [Google Cloud Documentation](https://cloud.google.com/docs)

## Getting Help

If you need help obtaining API keys:

1. **OpenAI**: https://platform.openai.com/api-keys
2. **Anthropic**: https://console.anthropic.com/settings/keys
3. **Stripe**: https://dashboard.stripe.com/apikeys
4. **Supabase**: https://app.supabase.com/project/_/settings/api
5. **SendGrid**: https://app.sendgrid.com/settings/api_keys
6. **AWS**: https://console.aws.amazon.com/iam/home#/security_credentials
7. **GCP**: https://console.cloud.google.com/apis/credentials

## License

MIT

// API Configuration Manager
// Loads and validates API tokens from environment variables

require('dotenv').config({ path: '.env.local' });

/**
 * Configuration object containing all API tokens and settings
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // AI Providers
  ai: {
    provider: process.env.AI_PROVIDER || 'openai', // 'openai' or 'anthropic'

    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
      orgId: process.env.OPENAI_ORG_ID,
    },

    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10),
      version: process.env.ANTHROPIC_VERSION || '2023-06-01',
    },
  },

  // Google Cloud Platform
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    clientEmail: process.env.GCP_CLIENT_EMAIL,
    privateKey: process.env.GCP_PRIVATE_KEY,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,

    storage: {
      bucketName: process.env.GCS_BUCKET_NAME,
      projectId: process.env.GCS_PROJECT_ID,
    },

    vision: {
      apiKey: process.env.GCP_VISION_API_KEY,
    },

    documentAI: {
      processorId: process.env.GCP_DOCUMENT_AI_PROCESSOR_ID,
      location: process.env.GCP_DOCUMENT_AI_LOCATION || 'us',
    },
  },

  // AWS Services
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    sessionToken: process.env.AWS_SESSION_TOKEN,

    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    },

    lambda: {
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      roleArn: process.env.AWS_LAMBDA_ROLE_ARN,
    },

    ses: {
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
      fromEmail: process.env.AWS_SES_FROM_EMAIL,
    },
  },

  // Payment Processing
  payment: {
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },

    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      mode: process.env.PAYPAL_MODE || 'sandbox',
    },
  },

  // Email Services
  email: {
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      fromName: process.env.SENDGRID_FROM_NAME,
    },

    resend: {
      apiKey: process.env.RESEND_API_KEY,
    },
  },

  // Analytics & Monitoring
  analytics: {
    mixpanel: {
      token: process.env.MIXPANEL_TOKEN,
    },

    segment: {
      writeKey: process.env.SEGMENT_WRITE_KEY,
    },

    posthog: {
      apiKey: process.env.POSTHOG_API_KEY,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    },

    googleAnalytics: {
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },

    sentry: {
      dsn: process.env.SENTRY_DSN,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    },
  },

  // Communication Services
  communication: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },

    slack: {
      botToken: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },

    discord: {
      botToken: process.env.DISCORD_BOT_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    },
  },

  // Storage & CDN
  storage: {
    cloudflare: {
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
    },

    vercelBlob: {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    },

    uploadthing: {
      secret: process.env.UPLOADTHING_SECRET,
      appId: process.env.UPLOADTHING_APP_ID,
    },
  },

  // Search & Indexing
  search: {
    algolia: {
      appId: process.env.ALGOLIA_APP_ID,
      adminApiKey: process.env.ALGOLIA_ADMIN_API_KEY,
      searchApiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,
      indexName: process.env.ALGOLIA_INDEX_NAME,
    },

    meilisearch: {
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      masterKey: process.env.MEILISEARCH_MASTER_KEY,
    },
  },

  // Vector Databases
  vectorDB: {
    pinecone: {
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
      indexName: process.env.PINECONE_INDEX_NAME,
    },

    weaviate: {
      url: process.env.WEAVIATE_URL,
      apiKey: process.env.WEAVIATE_API_KEY,
    },

    chroma: {
      url: process.env.CHROMA_URL || 'http://localhost:8000',
      apiKey: process.env.CHROMA_API_KEY,
    },
  },

  // Authentication
  auth: {
    auth0: {
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
    },

    clerk: {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    },

    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
    },
  },

  // Databases
  database: {
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      token: process.env.REDIS_TOKEN,
    },

    mongodb: {
      uri: process.env.MONGODB_URI,
    },

    postgres: {
      url: process.env.DATABASE_URL,
    },

    upstash: {
      redisUrl: process.env.UPSTASH_REDIS_REST_URL,
      redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
  },
};

/**
 * Validates that required configuration values are present
 * @param {string[]} requiredKeys - Array of required config keys (dot notation)
 * @returns {object} - Object with isValid boolean and missing keys array
 */
function validateConfig(requiredKeys) {
  const missing = [];

  for (const key of requiredKeys) {
    const value = getNestedValue(config, key);
    if (!value) {
      missing.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Gets a nested value from an object using dot notation
 * @param {object} obj - The object to search
 * @param {string} path - The path to the value (e.g., 'ai.openai.apiKey')
 * @returns {*} - The value at the path, or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Gets configuration for a specific service
 * @param {string} service - The service name (e.g., 'openai', 'stripe')
 * @returns {object|null} - The configuration object or null if not found
 */
function getServiceConfig(service) {
  const serviceLower = service.toLowerCase();

  // Map common service names to config paths
  const serviceMap = {
    openai: config.ai.openai,
    anthropic: config.ai.anthropic,
    stripe: config.payment.stripe,
    paypal: config.payment.paypal,
    sendgrid: config.email.sendgrid,
    resend: config.email.resend,
    supabase: config.supabase,
    aws: config.aws,
    gcp: config.gcp,
    s3: config.aws.s3,
    twilio: config.communication.twilio,
    slack: config.communication.slack,
    discord: config.communication.discord,
    mixpanel: config.analytics.mixpanel,
    segment: config.analytics.segment,
    posthog: config.analytics.posthog,
    sentry: config.analytics.sentry,
    algolia: config.search.algolia,
    pinecone: config.vectorDB.pinecone,
    redis: config.database.redis,
    mongodb: config.database.mongodb,
  };

  return serviceMap[serviceLower] || null;
}

/**
 * Checks if a service is configured (has at least one API key/token)
 * @param {string} service - The service name
 * @returns {boolean} - True if the service has configuration
 */
function isServiceConfigured(service) {
  const serviceConfig = getServiceConfig(service);
  if (!serviceConfig) return false;

  // Check if at least one value in the config object is truthy
  return Object.values(serviceConfig).some(value => Boolean(value));
}

/**
 * Gets the currently active AI provider configuration
 * @returns {object} - The active AI provider config
 */
function getActiveAIProvider() {
  const provider = config.ai.provider;
  return {
    name: provider,
    config: config.ai[provider],
  };
}

/**
 * Masks sensitive values for logging (shows first 4 and last 4 characters)
 * @param {string} value - The value to mask
 * @returns {string} - The masked value
 */
function maskSensitiveValue(value) {
  if (!value || value.length < 12) {
    return '***';
  }
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

/**
 * Gets a sanitized version of the config for logging (masks sensitive values)
 * @returns {object} - Config with masked sensitive values
 */
function getSanitizedConfig() {
  const sanitize = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitize(value);
      } else if (typeof value === 'string' && value.length > 0) {
        // Mask values that look like API keys/tokens
        if (key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('password')) {
          result[key] = maskSensitiveValue(value);
        } else {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  return sanitize(config);
}

module.exports = {
  config,
  validateConfig,
  getServiceConfig,
  isServiceConfigured,
  getActiveAIProvider,
  maskSensitiveValue,
  getSanitizedConfig,
};

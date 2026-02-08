const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
        ],
    },
};

const hasSentry = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

module.exports = hasSentry
    ? withSentryConfig(nextConfig, {
          silent: true,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
      })
    : nextConfig;

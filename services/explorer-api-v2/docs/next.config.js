const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
});

module.exports = withNextra({
  basePath: '/api-docs',
  assetPrefix: '/api-docs',
  images: {
    unoptimized: true,
  },
});


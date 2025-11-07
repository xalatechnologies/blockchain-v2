import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span>Nor Chain API</span>,
  project: {
    link: 'https://github.com/nor-chain/blockchain-v2',
  },
  chat: {
    link: 'https://discord.gg/norchain',
  },
  docsRepositoryBase: 'https://github.com/nor-chain/blockchain-v2/tree/main/services/explorer-api-v2/docs',
  footer: {
    text: 'Nor Chain Explorer API Documentation',
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  search: {
    placeholder: 'Search documentation...',
  },
  editLink: {
    text: 'Edit this page on GitHub →',
  },
};

export default config;


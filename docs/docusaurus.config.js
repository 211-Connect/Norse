// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'NORSE Documentation',
  tagline: 'The modern search engine for community resources.',
  favicon: 'img/logo-270x270.png',

  // Set the production url of your site here
  url: 'https://docs.c211.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  trailingSlash: false,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: '211-connect', // Usually your GitHub org/user name.
  projectName: 'Norse', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/211-Connect/Norse/tree/main/docs',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      // image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'NORSE',
        logo: {
          alt: 'Connect 211 Logo',
          src: 'img/logo-270x270.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://connect211.com/category/developer-articles',
            label: 'Blog',
            position: 'right',
          },
          {
            href: 'https://github.com/211-Connect/Norse',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://discord.gg/EyfQqJTyyq',
            label: 'Discord',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/norse',
              },
              {
                label: 'Discussions',
                href: 'https://github.com/211-Connect/Norse/discussions',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/EyfQqJTyyq',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                href: 'https://connect211.com/category/developer-articles',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/211-Connect/Norse',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} NORSE. The modern search engine for community resources.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;

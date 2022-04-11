const path = require('path');

module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      ({
        path: path.resolve(__dirname, './docs'),
        sidebarPath: path.resolve(__dirname, './sidebars.js'),
        // Please change this to your repo.
        editUrl:
          'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
      }),
    ],
    [
      '@docusaurus/plugin-content-blog',
      ({
        path: path.resolve(__dirname, './blog'),
        showReadingTime: true,
        // Please change this to your repo.
        editUrl:
          'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
      }),
    ],
    [
      '@docusaurus/plugin-content-pages',
      ({
        path: path.resolve(__dirname, './src/pages'),
      }),
    ],
  ],
  staticDirectories: [path.resolve(__dirname, './static')],
};

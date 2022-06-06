const path = require('path');

module.exports = {
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'docs',
        path: path.resolve(__dirname, './docs'),
        sidebarPath: path.resolve(__dirname, './sidebars.js'),
        disableVersioning: false,
        includeCurrentVersion: true,
        lastVersion: undefined,
        versions: {
          current: {
            label: 'Android SDK v2.0.0 (WIP)',
            path: 'android-2.0.0',
            banner: 'none',
          },
          '1.0.0': {
            label: 'Android SDK v1.0.0',
            path: 'android-1.0.0',
            banner: 'unmaintained',
          },
        },
        onlyIncludeVersions: ['current', '1.0.0', '2.0.0'],
      },
    ],
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'blog',
        path: path.resolve(__dirname, './blog'),
        showReadingTime: true,
      },
    ],
    [
      '@docusaurus/plugin-content-pages',
      {
        id: 'pages',
        path: path.resolve(__dirname, './src/pages'),
      },
    ],
  ],
  staticDirectories: [path.resolve(__dirname, './static')],
};

// config-overrides.js (Correct version for react-scripts@3.x.x / Webpack 4)

const { override } = require('customize-cra');

module.exports = override(
  // Do NOT add 'config.resolve.fallback' here. It is a Webpack 5 feature.
  // react-scripts 3.x.x (Webpack 4) does not support it and will throw an error.

  // If you had other customization needs compatible with Webpack 4,
  // such as adding Webpack aliases, you would put them here using
  // customize-cra functions like addWebpackAlias.

  // Example (uncomment if you use aliases):
  // const { addWebpackAlias } = require('customize-cra');
  // const path = require('path');
  // addWebpackAlias({
  //   '@components': path.resolve(__dirname, 'src/components')
  // }),
);
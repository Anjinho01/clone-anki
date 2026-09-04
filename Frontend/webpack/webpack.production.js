const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CreateFileWebpack = require('create-file-webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { baseUrl, publicUrl } = require('./config');

const pathBuild = path.resolve(__dirname, '..', 'build');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    app: './src/index.tsx',
  },
  output: {
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
    path: pathBuild,
    publicPath: publicUrl + (baseUrl ? '/' : ''),
    clean: true,
    pathinfo: false,
    hashFunction: 'xxhash64', // Fix for WASM hash error
  },
  plugins: [
    // ✅ Cria arquivo .htaccess otimizado para Apache
    new CreateFileWebpack({
      path: pathBuild,
      fileName: '.htaccess',
      content:
        '# Force HTTPS\n' +
        'RewriteEngine On\n' +
        'RewriteCond %{HTTPS} !=on\n' +
        'RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301,NE]\n' +
        'Header always set Content-Security-Policy "upgrade-insecure-requests;"\n' +
        '\n# SPA Routing\n' +
        'RewriteEngine On\n' +
        `RewriteBase ${baseUrl || '/'}\n` +
        'RewriteRule ^index\\.html$ - [L]\n' +
        'RewriteCond %{REQUEST_FILENAME} !-f\n' +
        'RewriteCond %{REQUEST_FILENAME} !-d\n' +
        'RewriteCond %{REQUEST_FILENAME} !-l\n' +
        `RewriteRule . ${baseUrl || '/'}/index.html [L]\n` +
        '\n# Cache Control - Otimizado\n' +
        '<IfModule mod_headers.c>\n' +
        '  # Cache static assets for 1 year\n' +
        '  <FilesMatch "\\.(js|css|woff|woff2|ttf|eot|jpg|jpeg|png|gif|webp|ico)$">\n' +
        '    Header set Cache-Control "max-age=31536000, public, immutable"\n' +
        '  </FilesMatch>\n' +
        '  # SVG com cache moderado\n' +
        '  <FilesMatch "\\.svg$">\n' +
        '    Header set Cache-Control "max-age=2592000, public"\n' +
        '  </FilesMatch>\n' +
        '  # Don\'t cache HTML\n' +
        '  <FilesMatch "\\.html$">\n' +
        '    Header set Cache-Control "no-cache, no-store, must-revalidate"\n' +
        '    Header set Pragma "no-cache"\n' +
        '    Header set Expires "0"\n' +
        '  </FilesMatch>\n' +
        '</IfModule>\n' +
        '\n# Gzip Compression\n' +
        '<IfModule mod_deflate.c>\n' +
        '  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json application/x-font-woff application/x-font-ttf image/svg+xml\n' +
        '</IfModule>\n',
    }),
    // ✅ Bundle Analyzer (apenas quando ANALYZE=true)
    process.env.ANALYZE === 'true' &&
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: true,
        reportFilename: 'bundle-report.html',
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
      }),
  ].filter(Boolean),
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 2020,
          },
          compress: {
            ecma: 2020,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true,
            drop_debugger: true,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 2020,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        // ⚡ React core separado (alta prioridade)
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/,
          name: 'vendor.react',
          chunks: 'all',
          priority: 40,
          reuseExistingChunk: true,
        },
        // ⚡ Material-UI separado
        mui: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: 'vendor.mui',
          chunks: 'all',
          priority: 30,
          reuseExistingChunk: true,
        },
        // ⚡ Emotion separado
        emotion: {
          test: /[\\/]node_modules[\\/]@emotion[\\/]/,
          name: 'vendor.emotion',
          chunks: 'all',
          priority: 25,
          reuseExistingChunk: true,
        },
        // ⚡ Redux separado
        redux: {
          test: /[\\/]node_modules[\\/](@reduxjs|react-redux|redux)[\\/]/,
          name: 'vendor.redux',
          chunks: 'all',
          priority: 20,
          reuseExistingChunk: true,
        },
        // ⚡ Lodash separado
        lodash: {
          test: /[\\/]node_modules[\\/]lodash[\\/]/,
          name: 'vendor.lodash',
          chunks: 'all',
          priority: 15,
          reuseExistingChunk: true,
        },
        // ⚡ Outros vendors (vendor genérico)
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
        },
        // ⚡ Código comum da aplicação
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          name: 'common',
        },
      },
    },
  },
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
});

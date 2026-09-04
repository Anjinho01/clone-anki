const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { baseUrl, publicUrl, apiUrl, recaptchaSiteKey } = require('./config');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = {
  module: {
    rules: [
      // TypeScript/JavaScript via Babel (supports .ts, .tsx, .js, .jsx)
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            cacheCompression: false,
            presets: [
              ['@babel/preset-env', { modules: false }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
          },
        },
      },
      // CSS with Tailwind (via PostCSS)
      {
        test: /\.css$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: devMode,
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: devMode,
            },
          },
        ],
      },
      // Images (inline small images < 10kb)
      {
        test: /\.(png|jpe?g|gif|webp|avif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 10kb
          },
        },
        generator: {
          filename: 'assets/images/[name].[hash:8][ext]',
        },
      },
      // SVG
      {
        test: /\.svg$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[hash:8][ext]',
        },
      },
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[hash:8][ext]',
        },
      },
      // Raw text files
      {
        test: /\.(txt|md)$/,
        type: 'asset/source',
      },
    ],
  },
  plugins: [
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
      cache: false,
      fix: true,
      emitWarning: devMode,
      emitError: !devMode,
      failOnError: !devMode,
    }),
    // ✅ Define environment variables for browser
    new webpack.DefinePlugin({
      'process.env.PUBLIC_URL': JSON.stringify(baseUrl || '/'),
      'process.env.API_URL': JSON.stringify(apiUrl),
      'process.env.RECAPTCHA_SITE_KEY': JSON.stringify(recaptchaSiteKey),
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development',
      ),
    }),
    new HtmlWebpackPlugin({
      baseUrl: baseUrl || '/',
      title: 'Flashcards',
      template: './public/index.html',
      favicon: './public/favicon.ico',
      inject: 'body',
      scriptLoading: 'defer',
      minify: !devMode && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    !devMode &&
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: baseUrl ? `${baseUrl}/` : '/',
      }),
    !devMode &&
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css',
        chunkFilename: 'css/[name].[contenthash:8].chunk.css',
      }),
    new CopyPlugin({
      patterns: [
        {
          from: './public/assets',
          to: 'assets',
          noErrorOnMissing: true,
        },
        {
          from: './public/robots.txt',
          to: 'robots.txt',
          noErrorOnMissing: true,
        },
        {
          from: './public/manifest.json',
          to: 'manifest.json',
          noErrorOnMissing: true,
        },
      ],
    }),
  ].filter(Boolean),
  resolve: {
    plugins: [new TsconfigPathsPlugin({ configFile: path.resolve(__dirname, '..', 'tsconfig.json') })],
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  performance: {
    hints: devMode ? false : 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};

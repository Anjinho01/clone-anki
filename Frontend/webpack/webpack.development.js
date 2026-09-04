const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { port, proxyRoutes, proxyTarget } = require('./config.js');

module.exports = merge(common, {
  target: 'web',
  mode: 'development',
  devtool: 'cheap-module-source-map', // Mais rápido e menor que eval-source-map
  entry: {
    app: './src/index.tsx',
  },
  output: {
    filename: 'js/[name].bundle.js',
    chunkFilename: 'js/[name].chunk.js',
    path: path.resolve(__dirname, '..', 'build'),
    publicPath: '/',
    pathinfo: false, // Improve build performance
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
    runtimeChunk: true,
    moduleIds: 'named',
    chunkIds: 'named',
  },
  devServer: {
    historyApiFallback: true,
    host: 'localhost',
    port: port, // ✅ Agora vem do .env
    hot: true,
    liveReload: true,
    open: {
      app: ['chrome'],
    },
    compress: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: (error) => {
          // ✅ Ignora erro do ResizeObserver mas loga para investigação
          if (error.message.includes('ResizeObserver loop')) {
            console.group('🔍 ResizeObserver Warning Detectado');
            console.log('📋 Mensagem:', error.message);
            console.log('📍 Stack:', error.stack?.slice(0, 500));
            console.log('⏰ Timestamp:', new Date().toLocaleTimeString());
            console.log('🎯 Ação: Overlay suprimido (warning esperado)');
            console.log('ℹ️  Se causar problemas visuais, reporte!');
            console.groupEnd();
            return false; // Não mostra overlay
          }
          return true; // Mostra overlay para outros erros
        },
      },
      progress: true,
    },
    static: {
      directory: path.resolve(__dirname, '..', 'public'),
      publicPath: '/',
    },
    watchFiles: {
      paths: ['src/**/*', 'public/**/*'],
      options: {
        usePolling: false,
      },
    },
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    // ✅ Proxy configurado via .env
    proxy: [
      {
        context: proxyRoutes, // ✅ Agora vem do .env (PROXY_ROUTES)
        target: proxyTarget,   // ✅ Agora vem do .env (PROXY_TARGET)
        changeOrigin: true,
        secure: false,
        ws: true, // WebSocket support
        cookieDomainRewrite: 'localhost',
        onProxyReq: (proxyReq, req, res) => {
          // Log das requisições proxy (útil para debug)
          console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
      },
    ],
  },
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '..', '.webpack_cache'),
  },
});

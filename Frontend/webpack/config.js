/**
 * 🎯 ÚNICA CONFIGURAÇÃO DO PROJETO
 *
 * Todas as configurações vêm do .env:
 * - PUBLIC_URL: Rota base
 * - PORT: Porta do dev server
 * - DOMAIN: Domínio de produção
 * - PROXY_ROUTES: Rotas para proxy
 * - PROXY_TARGET: Servidor backend
 */

// 🔧 Carrega variáveis do .env baseado no ambiente
const path = require('path');
const dotenv = require('dotenv');

// Determina o ambiente
const isDevelopment = process.env.NODE_ENV !== 'production';
const envFile = isDevelopment ? '.env.development' : '.env.production';

// Carrega o arquivo .env apropriado
const envPath = path.resolve(__dirname, '..', envFile);
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.warn(`⚠️  Arquivo ${envFile} não encontrado. Usando variáveis de ambiente do sistema.`);
} else {
  console.log(`✅ Variáveis carregadas de: ${envFile}`);
}

/**
 * Normaliza a URL base
 */
function normalizeBaseUrl(url) {
  if (!url || url === '/') return '';
  let normalized = url.replace(/\/+$/, '');
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  return normalized;
}

/**
 * Parse proxy routes do .env
 */
function parseProxyRoutes(routesString) {
  if (!routesString) return ['/api'];
  return routesString.split(',').map(route => route.trim());
}

/**
 * 🔧 CONFIGURAÇÃO CENTRAL
 */
// isDevelopment já foi definido acima
const port = parseInt(process.env.PORT || '8375', 10);
const baseUrl = normalizeBaseUrl(process.env.PUBLIC_URL || '');
const domain = process.env.DOMAIN || 'https://mydomain.com';
const apiUrl = process.env.API_URL || (isDevelopment ? 'http://localhost:3007' : '');
const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || '';
const proxyTarget = process.env.PROXY_TARGET || 'http://localhost:3007';
const proxyRoutes = parseProxyRoutes(process.env.PROXY_ROUTES);

const publicUrl = isDevelopment
  ? `http://localhost:${port}${baseUrl}`
  : `${domain}${baseUrl}`;

// Log da configuração
console.log('\n📦 Configuração:');
console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`   Porta: ${port}`);
console.log(`   Base URL: ${baseUrl || '/'} ${!baseUrl ? '(root)' : ''}`);
console.log(`   Public URL: ${publicUrl}`);
console.log(`   API URL: ${apiUrl}`);
if (isDevelopment) {
  console.log(`   Proxy: ${proxyRoutes.join(', ')} → ${proxyTarget}`);
}
if (!isDevelopment) {
  console.log(`   Domain: ${domain}`);
}
console.log('');

module.exports = {
  port,
  baseUrl,
  publicUrl,
  domain,
  apiUrl,
  recaptchaSiteKey,
  proxyTarget,
  proxyRoutes,
  isDevelopment,
  isProduction: !isDevelopment,
};

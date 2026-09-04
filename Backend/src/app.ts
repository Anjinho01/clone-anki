import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env';
import logger from './config/logger';
import { healthCheck, getActiveConnections } from './config/database';
import { register } from './config/metrics';
import { helmetConfig, securityHeaders, abortDetection } from './middlewares/securityMiddleware';
import { metricsMiddleware } from './middlewares/metricsMiddleware';
import { dateConverterMiddleware } from './middlewares/dateConverterMiddleware';
import { globalLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { verifyToken, requireRole } from './middlewares/authMiddleware';
import { setupSwagger } from './swagger';

// Routes
import authRoutes from './routes/auth.routes';
import deckRoutes from './routes/deck.routes';
import cardRoutes from './routes/card.routes';
import packageRoutes from './routes/package.routes';
import libraryCardRoutes from './routes/libraryCard.routes';
import reviewRoutes from './routes/review.routes';
import syncRoutes from './routes/sync.routes';
import logRoutes from './routes/log.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// -- 1. Fingerprint suppression (padrão ade90) -------------------------
app.disable('x-powered-by');

// -- 2. Trust proxy (para nginx/load balancer — padrão ade90) -----------
if (env.TRUST_PROXY !== false) {
  app.set('trust proxy', env.TRUST_PROXY);
}

// -- 3. Security Headers (Helmet + custom — padrão ade90) ---------------
app.use(helmetConfig);
app.use(securityHeaders);

// -- 4. Metrics middleware (padrão ade90 — captura duração/status) ------
app.use(metricsMiddleware);

// -- 5. CORS (multi-origin com whitelist — padrão ade90) ----------------
const corsOriginValidator: cors.CorsOptions['origin'] = (origin, callback) => {
  // Permitir requests sem origin (mobile, curl, Postman)
  if (!origin) return callback(null, true);
  if (env.FRONTEND_ORIGINS.includes(origin)) return callback(null, true);

  logger.warn(`CORS bloqueado para origin: ${origin}`);
  callback(new Error('Bloqueado pelo CORS'));
};

const corsOptions: cors.CorsOptions = {
  origin: corsOriginValidator,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 600, // 10 min preflight cache
};

app.use(cors(corsOptions));

// Preflight explícito (padrão ade90)
app.options('*', cors(corsOptions));

// -- 6. Rate Limiting Global (padrão Quoti/Argyx/Ade90) -----------------
app.use(globalLimiter);

// -- 7. Cookie parser ---------------------------------------------------
app.use(cookieParser());

// -- 8. Body Parsing (limite 2mb — padrão ade90) ------------------------
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// -- 9. Date converter (padrão ade90 — MySQL dates → ISO-8601) ----------
app.use(dateConverterMiddleware);

// -- 10. Abort detection (padrão ade90) ---------------------------------
app.use(abortDetection);

// -- 11. Request Logger (dev only) --------------------------------------
if (env.isDev()) {
  app.use((req: Request, _res: Response, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

// -- Health Check (padrão Quoti/Argyx) ----------------------------------
app.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await healthCheck();
  const connections = await getActiveConnections();

  const status = dbHealthy ? 200 : 503;
  res.status(status).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: {
      connected: dbHealthy,
      activeConnections: connections,
    },
  });
});

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// -- Prometheus Metrics (padrão ade90 — protegido por auth + admin) -----
app.get('/metrics', verifyToken, requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(String(error));
  }
});

// -- Swagger Docs (padrão de todos os projetos) -------------------------
setupSwagger(app);

// -- Routes -------------------------------------------------------------
app.use('/auth', authRoutes);
app.use('/decks', deckRoutes);
app.use('/cards', cardRoutes);
app.use('/packages', packageRoutes);
app.use('/library-cards', libraryCardRoutes);
app.use('/reviews', reviewRoutes);
app.use('/sync', syncRoutes);
app.use('/logs', logRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/notifications', notificationRoutes);

// -- 404 + Error Handler (padrão centralizado) -------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

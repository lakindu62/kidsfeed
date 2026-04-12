const configuredOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (configuredOrigins.length === 0) {
  console.warn(
    '[CORS] WARNING: FRONTEND_ORIGINS is not configured. Only localhost origins are allowed. Set FRONTEND_ORIGINS to a comma-separated list of allowed production/staging URLs.'
  );
}

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://kidsfeed.vercel.app',
  'https://kidsfeed-git-dev-lakindus-projects.vercel.app',
  ...configuredOrigins,
];

export const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server and tooling requests that do not send Origin.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const handleCorsPreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
};

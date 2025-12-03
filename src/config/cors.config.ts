import cors from 'cors';

const originList = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim());

const corsOptions: cors.CorsOptions = {
  origin: originList,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
};

export default cors(corsOptions);

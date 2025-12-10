import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Application } from 'express';
import { env } from './env.config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Team03 Backend API',
      version: '1.0.0',
      description: 'Budget/Auth 등 도메인 API 문서',
    },
    servers: [{ url: `http://localhost:${env.PORT}`, description: 'local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Authorization: Bearer <accessToken>',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // swagger 소스 위치 (TS)
  apis: [path.resolve(__dirname, '../swagger/*.ts')],
};

const swaggerSpec = swaggerJsdoc(options);

export function swaggerDocs(app: Application) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger UI: http://localhost:${env.PORT}/api-docs`);
}

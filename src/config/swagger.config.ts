import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Application } from 'express';
import { env } from './env.config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Snack API Documentation',
      version: '1.0.0',
      description: 'Snack 프로젝트를 위한 API 문서입니다.',
    },
    servers: [
      { url: `http://localhost:${env.PORT}`, description: 'Local development' },
      {
        url: `https://${env.API_HOST}`,
        description: 'Render production',
      },
    ],
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
    security: [],
  },
  // swagger 소스 위치 (TS)
  apis: [path.resolve(__dirname, '../swagger/*.ts')],
};

const swaggerSpec = swaggerJsdoc(options);

export function swaggerDocs(app: Application) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger UI: http://localhost:${env.PORT}/api-docs`);
  console.log(`Swagger UI: https://${env.API_HOST}/api-docs`);
}

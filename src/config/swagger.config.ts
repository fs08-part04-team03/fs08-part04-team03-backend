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

/**
 * Express 애플리케이션에 Swagger UI를 /api-docs 경로로 등록한다.
 *
 * 설정을 적용한 뒤 콘솔에 Swagger UI 접근 URL(`http://localhost:<PORT>/api-docs`)을 출력한다.
 *
 * @param app - Swagger UI를 마운트할 Express 애플리케이션 인스턴스
 */
export function swaggerDocs(app: Application) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger UI: http://localhost:${env.PORT}/api-docs`);
}
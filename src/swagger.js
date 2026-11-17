
import swaggerJsdoc from 'swagger-jsdoc';
const opcoes = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Rede Raízes do Nordeste',
      version: '1.0.0',
      description: 'Documentação da API do sistema Rede Raízes do Nordeste.'
    },
    servers: [
      {
        url: 'http://localhost:3000'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/api/routes/*.js']
};
const swaggerSpec = swaggerJsdoc(opcoes);
export default swaggerSpec;

import express from 'express';
import unidadesRoutes from './routes/unidades.routes.js';
import produtosRoutes from './routes/produtos.routes.js';
import estoqueRoutes from './routes/estoque.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../swagger.js';
const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/unidades', unidadesRoutes);
app.use('/produtos', produtosRoutes);
app.use('/estoque', estoqueRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/usuarios', usuariosRoutes);
app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Rede Raízes do Nordeste funcionando!'
  });
});
export default app;
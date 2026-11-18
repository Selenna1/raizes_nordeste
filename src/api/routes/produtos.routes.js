import express from 'express';
import pool from '../../infrastructure/database.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirPerfis } from '../middlewares/permissao.middleware.js';

const router = express.Router();
/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Lista todos os produtos
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos consultada com sucesso
 *       500:
 *         description: Erro ao consultar produtos
 */
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM produtos'
    );
      return res.status(200).json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao consultar produtos'
    });
  }
});

/**
 * @swagger
 * /produtos:
 *   post:
 *     summary: Cadastra um novo produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - preco
 *               - ativo
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Suco Natural
 *               descricao:
 *                 type: string
 *                 example: Suco natural para teste
 *               preco:
 *                 type: number
 *                 example: 8.5
 *               categoria:
 *                 type: string
 *                 example: Bebidas
 *               ativo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Produto cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token não informado ou inválido
 *       403:
 *         description: Usuário sem permissão
 *       500:
 *         description: Erro ao cadastrar produto
 */
router.post('/', autenticar, permitirPerfis('ADMIN', 'GERENTE'), async (req, res) => {
  const { nome, descricao, preco, categoria, ativo } = req.body;
  if (
    !nome ||
    typeof preco !== 'number' ||
    !Number.isFinite(preco) ||
    preco < 0 ||
    typeof ativo !== 'boolean'
  ) {
    return res.status(400).json({
      erro: 'Dados inválidos para cadastrar produto'
    });
  }
  try {
    const resultado = await pool.query(
      `INSERT INTO produtos
      (nome, descricao, preco, categoria, ativo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [nome, descricao ?? null, preco, categoria ?? null, ativo]
  );
    return res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao cadastrar produto'
    });
  }
});

/**
 * @swagger
 * /produtos/{id}:
 *   get:
 *     summary: Consulta um produto pelo ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador do produto
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro ao consultar produto
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      'SELECT * FROM produtos WHERE id = $1',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Produto não encontrado'
      });
    }
    return res.status(200).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao consultar produto'
    });
  }
});

/**
 * @swagger
 * /produtos/{id}:
 *   put:
 *     summary: Atualiza um produto
 *     tags: [Produtos]
 *     security:
 *        - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Suco Natural Atualizado
 *               descricao:
 *                 type: string
 *                 example: Suco natural atualizado
 *               preco:
 *                 type: number
 *                 example: 9.5
 *               categoria:
 *                 type: string
 *                 example: Bebidas
 *               ativo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token não informado ou inválido
 *       403:
 *         description: Usuário sem permissão
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro ao atualizar produto
 */
router.put('/:id', autenticar, permitirPerfis('ADMIN', 'GERENTE'), async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, categoria, ativo } = req.body;
  if (
    !nome ||
      typeof preco !== 'number' ||
      !Number.isFinite(preco) ||
      preco < 0 ||
      typeof ativo !== 'boolean'
  ) {
    return res.status(400).json({
      erro: 'Dados inválidos para atualizar produto'
    });
  } 
  try{
    const resultado = await pool.query(
      `UPDATE produtos
      SET nome = $1,
        descricao = $2,
        preco = $3,
        categoria = $4,
        ativo = $5
      WHERE id = $6
      RETURNING *`,
      [nome, descricao ?? null, preco, categoria ?? null, ativo, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Produto não encontrado'
      });
    }
    return res.status(200).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao atualizar produto'
    });
  }
}); 

/**
 * @swagger
 * /produtos/{id}:
 *   delete:
 *     summary: Remove um produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador do produto
 *     responses:
 *       200:
 *         description: Produto removido com sucesso
 *       401:
 *         description: Token não informado ou inválido
 *       403:
 *         description: Usuário sem permissão
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro ao remover produto
 */
router.delete('/:id', autenticar, permitirPerfis('ADMIN', 'GERENTE'), async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      'DELETE FROM produtos WHERE id = $1 RETURNING *',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Produto não encontrado'
      });
    }
    return res.status(200).json({
      mensagem: 'Produto removido com sucesso',
      produto: resultado.rows[0]
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao excluir produto'
    });
  }
});
export default router;
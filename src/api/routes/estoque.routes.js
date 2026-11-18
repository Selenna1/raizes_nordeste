import express from 'express';
import pool from '../../infrastructure/database.js';

const router = express.Router();

/**
 * @swagger
 * /estoque:
 *   get:
 *     summary: Consulta todos os registros de estoque
 *     tags: [Estoque]
 *     responses:
 *       200:
 *         description: Lista de estoque consultada com sucesso
 *       500:
 *         description: Erro ao consultar estoque
 */
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM estoque'
    );
    return res.status(200).json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({
          erro: 'Erro ao consultar estoque'
        });
    }
});

/**
 * @swagger
 * /estoque/unidade/{id}:
 *   get:
 *     summary: Consulta o estoque de uma unidade
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador da unidade
 *     responses:
 *       200:
 *         description: Estoque da unidade consultado com sucesso
 *       500:
 *         description: Erro ao consultar estoque da unidade
 */
router.get('/unidade/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      'SELECT * FROM estoque WHERE id_unidade = $1',
      [id]
    );
    return res.status(200).json(resultado.rows);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({
        erro: 'Erro ao consultar estoque da unidade'
      });
    }
});

/**
 * @swagger
 * /estoque:
 *   post:
 *     summary: Cadastra um registro de estoque
 *     tags: [Estoque]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_unidade
 *               - id_produto
 *               - quantidade
 *             properties:
 *               id_unidade:
 *                 type: integer
 *                 example: 3
 *               id_produto:
 *                 type: integer
 *                 example: 2
 *               quantidade:
 *                 type: integer
 *                 example: 15
 *     responses:
 *       201:
 *         description: Registro de estoque cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro ao cadastrar estoque
 */
router.post('/', async (req, res) => {
  const { id_unidade, id_produto, quantidade } = req.body;
  if (
    !Number.isInteger(id_unidade) ||
    !Number.isInteger(id_produto) ||
    !Number.isInteger(quantidade) ||
    id_unidade <= 0 ||
    id_produto <= 0 ||
    quantidade < 0
  ) {
      return res.status(400).json({
        erro: 'Dados inválidos para cadastrar estoque'
      });
  }
  try {
    const resultado = await pool.query(
      `INSERT INTO estoque
      (id_unidade, id_produto, quantidade)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [id_unidade, id_produto, quantidade]
    );
    return res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao cadastrar estoque'
    });
  }
});


/**
 * @swagger
 * /estoque/{id}:
 *   put:
 *     summary: Atualiza a quantidade de estoque
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador do registro de estoque
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantidade
 *             properties:
 *               quantidade:
 *                 type: integer
 *                 example: 20
 *     responses:
 *       200:
 *         description: Estoque atualizado com sucesso
 *       400:
 *         description: Quantidade inválida
 *       404:
 *         description: Registro de estoque não encontrado
 *       500:
 *         description: Erro ao atualizar estoque
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantidade } = req.body;
  if (!Number.isInteger(quantidade) || quantidade < 0) {
    return res.status(400).json({
      erro: 'Quantidade inválida'
    });
  }
  try {
    const resultado = await pool.query(
      `UPDATE estoque
      SET quantidade = $1
      WHERE id = $2
      RETURNING *`,
      [quantidade, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Registro de estoque não encontrado'
      });
    }
    return res.status(200).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao atualizar estoque'
    });
  }
});


/**
 * @swagger
 * /estoque/{id}:
 *   delete:
 *     summary: Remove um registro de estoque
 *     tags: [Estoque]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador do registro de estoque
 *     responses:
 *       200:
 *         description: Registro de estoque removido com sucesso
 *       404:
 *         description: Registro de estoque não encontrado
 *       500:
 *         description: Erro ao excluir registro de estoque
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      'DELETE FROM estoque WHERE id = $1 RETURNING *',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Registro de estoque não encontrado'
      });
    }
    return res.status(200).json({
      mensagem: 'Registro de estoque removido com sucesso',
      estoque: resultado.rows[0]
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao excluir registro de estoque'
    });
  }
});

export default router;
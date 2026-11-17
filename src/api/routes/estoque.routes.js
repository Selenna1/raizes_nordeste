import express from 'express';
import pool from '../../infrastructure/database.js';

const router = express.Router();

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
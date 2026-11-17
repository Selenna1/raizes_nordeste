import express from 'express';
import pool from '../../infrastructure/database.js';

const router = express.Router();
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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
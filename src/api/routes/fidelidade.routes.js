
import express from 'express';
import pool from '../../infrastructure/database.js';
import { autenticar } from '../middlewares/auth.middleware.js';
const router = express.Router();


/**
 * @swagger
 * /fidelidade/meus-dados:
 *   get:
 *     summary: Consulta os próprios dados do cliente
 *     tags: [Fidelidade]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do cliente consultados com sucesso
 *       401:
 *         description: Token não informado ou inválido
 *       403:
 *         description: Acesso permitido somente para clientes
 *       404:
 *         description: Dados do cliente não encontrados
 *       500:
 *         description: Erro interno
 */

router.get('/meus-dados', autenticar, async (req, res) => {
  try {
    if (req.usuario.perfil !== 'CLIENTE') {
      return res.status(403).json({
        erro: 'Somente clientes podem consultar os próprios dados.'
      });
    }
    const resultado = await pool.query(
      `SELECT
         u.id AS id_usuario,
         u.nome,
         u.email,
         u.perfil,
         u.criado_em,
         c.id AS id_cliente,
         c.telefone,
         f.pontos,
         f.consentimento,
         f.data_consentimento
       FROM usuarios u
       LEFT JOIN clientes c ON c.id = u.id_cliente
       LEFT JOIN fidelidade f ON f.id_cliente = c.id
       WHERE u.id = $1`,
      [req.usuario.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Dados do cliente não encontrados.'
      });
    }
    return res.status(200).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao consultar os dados do cliente.'
    });
  }
});



/**
 * @swagger
 * /fidelidade/consentimento:
 *   patch:
 *     summary: Atualiza o consentimento do cliente
 *     tags: [Fidelidade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consentimento
 *             properties:
 *               consentimento:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Consentimento atualizado com sucesso
 *       400:
 *         description: Valor de consentimento inválido
 *       401:
 *         description: Token não informado ou inválido
 *       403:
 *         description: Acesso permitido somente para clientes
 *       404:
 *         description: Registro de fidelidade não encontrado
 *       500:
 *         description: Erro interno
 */

router.patch('/consentimento', autenticar, async (req, res) => {
  try {
    const { consentimento } = req.body;
    if (typeof consentimento !== 'boolean') {
      return res.status(400).json({
        erro: 'Informe o consentimento como true ou false.'
      });
    }
    if (req.usuario.perfil !== 'CLIENTE') {
      return res.status(403).json({
        erro: 'Somente clientes podem alterar o próprio consentimento.'
      });
    }
    const resultado = await pool.query(
      `UPDATE fidelidade
       SET consentimento = $1,
           data_consentimento = CASE
             WHEN $1 = TRUE THEN NOW()
             ELSE NULL
           END,
           atualizado_em = NOW()
       WHERE id_cliente = (
         SELECT id_cliente FROM usuarios WHERE id = $2
       )
       RETURNING *`,
      [consentimento, req.usuario.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Registro de fidelidade não encontrado.'
      });
    }
    return res.status(200).json({
      mensagem: 'Consentimento atualizado com sucesso.',
      fidelidade: resultado.rows[0]
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: 'Erro ao atualizar consentimento.'
    });
  }
});
export default router;

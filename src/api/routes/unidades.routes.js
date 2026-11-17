import express from 'express';
import pool from '../../infrastructure/database.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirPerfis } from '../middlewares/permissao.middleware.js';
const router = express.Router();


/**
 * @swagger
 * /unidades:
 *   get:
 *     summary: Lista todas as unidades
 *     tags: [Unidades]
 *     responses:
 *       200:
 *         description: Lista de unidades retornada com sucesso
 *       500:
 *         description: Erro ao buscar unidades
 */

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM unidades');
    res.json(resultado.rows);
} catch (erro) {
    res.status(500).json({
        erro: 'Erro ao buscar unidades'
    });
}
});

/**
 * @swagger
 * /unidades:
 *   post:
 *     summary: Cadastra uma nova unidade
 *     tags: [Unidades]
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
 *               - cidade
 *               - ativa
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Unidade Centro
 *               endereco:
 *                 type: string
 *                 example: Rua de Teste, 100
 *               telefone:
 *                 type: string
 *                 example: "91999999999"
 *               cidade:
 *                 type: string
 *                 example: Belém
 *               ativa:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Unidade cadastrada com sucesso
 *       400:
 *         description: Dados obrigatórios ausentes ou inválidos
 *       401:
 *         description: Token não informado ou inválido
 *       403:
 *         description: Usuário sem permissão
 *       500:
 *         description: Erro ao cadastrar unidade
 */

router.post('/', autenticar, permitirPerfis('ADMIN', 'GERENTE'), async (req, res) => {
    const { nome, endereco, telefone, cidade, ativa } = req.body;
    if (!nome || !cidade || typeof ativa !== 'boolean') {
        return res.status(400).json({
            erro: 'Nome, cidade e situação da unidade são obrigatórios ou inválidos'
        });
    } 
    try {
        const resultado = await pool.query(
            `INSERT INTO unidades (nome, endereco, telefone, cidade, ativa) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [nome, endereco, telefone, cidade, ativa]
        );
        return res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({
            erro: 'Erro ao cadastrar unidade'
        });
    }
});


/**
 * @swagger
 * /unidades/{id}:
 *   get:
 *     summary: Consulta uma unidade pelo ID
 *     tags: [Unidades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da unidade
 *     responses:
 *       200:
 *         description: Unidade encontrada
 *       404:
 *         description: Unidade não encontrada
 *       500:
 *         description: Erro ao buscar unidade
 */

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query(
            'SELECT * FROM unidades WHERE id = $1',
            [id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Unidade não encontrada'
            });
        }
        return res.status(200).json(resultado.rows[0]);
    }
    catch (erro) {
        console.error(erro);
        return res.status(500).json({
            erro: 'Erro ao buscar unidade'
        });
    }
});


/**
 * @swagger
 * /unidades/{id}:
 *   put:
 *     summary: Atualiza os dados de uma unidade
 *     tags: [Unidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da unidade
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - cidade
 *               - ativa
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Unidade Centro Atualizada
 *               endereco:
 *                 type: string
 *                 example: Rua Nova, 200
 *               telefone:
 *                 type: string
 *                 example: "91988888888"
 *               cidade:
 *                 type: string
 *                 example: Belém
 *               ativa:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Unidade atualizada com sucesso
 *       400:
 *         description: Dados obrigatórios ausentes ou inválidos
 *       401:
 *         description: Token não informado ou inválido
 *       403:
 *         description: Usuário sem permissão
 *       404:
 *         description: Unidade não encontrada
 *       500:
 *         description: Erro ao atualizar unidade
 */

router.put('/:id', autenticar, permitirPerfis('ADMIN', 'GERENTE'), async (req, res) => {
    const { id } = req.params;
    const { nome, endereco, telefone, cidade, ativa } = req.body;
    if (!nome || !cidade || typeof ativa !== 'boolean') {
        return res.status(400).json({
            erro: 'Nome, cidade e situação da unidade são obrigatórios ou inválidos'
        });
    }
    try {
        const resultado = await pool.query(
            `UPDATE unidades
            SET nome = $1,
                endereco = $2,
                telefone = $3,
                cidade = $4,
                ativa = $5
            WHERE id = $6
            RETURNING *`,
            [nome, endereco, telefone, cidade, ativa, id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Unidade não encontrada'
            });
        }
        return res.status(200).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({
            erro: 'Erro ao atualizar unidade'
        });
    }
});


/**
 * @swagger
 * /unidades/{id}:
 *   delete:
 *     summary: Exclui uma unidade
 *     tags: [Unidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da unidade
 *     responses:
 *       200:
 *         description: Unidade removida com sucesso
 *       401:
 *         description: Token não informado ou inválido
 *       403:
 *         description: Usuário sem permissão
 *       404:
 *         description: Unidade não encontrada
 *       500:
 *         description: Erro ao excluir unidade
 */

router.delete('/:id', autenticar, permitirPerfis('ADMIN'), async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query(
            'DELETE FROM unidades WHERE id = $1 RETURNING *',
            [id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Unidade não encontrada'
            });
        }
        return res.status(200).json({
            mensagem: 'Unidade removida com sucesso',
            unidade: resultado.rows[0]
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({
            erro: 'Erro ao excluir unidade'
        });
    }
});
export default router;    
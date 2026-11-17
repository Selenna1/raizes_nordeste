import { Router } from 'express';
import pool from '../../infrastructure/database.js';
import bcrypt from 'bcrypt';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirPerfis } from '../middlewares/permissao.middleware.js';
import jwt from 'jsonwebtoken';
const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    // impede campo vazio
    if (!email || !senha) {
      return res.status(400).json({
          erro: 'E-mail e senha são obrigatórios.'
      });
    }
    const resultado = await pool.query(
      `SELECT id, id_unidade, nome, email, senha, perfil, ativo
      FROM usuarios
      WHERE email = $1`,
      [email]
    );
    const usuario = resultado.rows[0];
      if (!usuario || !usuario.ativo) {
      return res.status(401).json({
        erro: 'E-mail ou senha inválidos.'
      });
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({
          erro: 'E-mail ou senha inválidos.'
      });
    }
    const token = jwt.sign(
      {
          id: usuario.id,
          perfil: usuario.perfil,
          id_unidade: usuario.id_unidade
      },
      process.env.JWT_SECRET,
      {
          expiresIn: '8h'
      }
    );
    return res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil
      }
    });
  } catch (erro) {
    console.error('Erro ao realizar login:', erro.message);
    return res.status(500).json({
      erro: 'Erro interno ao realizar login.'
    });
  }
});


router.post(
  '/',
  autenticar,
  permitirPerfis('ADMIN', 'GERENTE'),
  async (req, res) => {
    try {
      const {
        nome,
        email,
        senha,
        perfil,
        id_unidade,
        id_cliente
      } = req.body;
      const emailNormalizado = email.trim().toLowerCase();
      if (
        typeof nome !== 'string' ||
        typeof email !== 'string' ||
        typeof senha !== 'string' ||
        typeof perfil !== 'string' ||
        !nome.trim() ||
        !email.trim() ||
        !senha.trim() ||
        !perfil.trim()
      ) {
        return res.status(400).json({
          erro: 'Nome, e-mail, senha e perfil são obrigatórios.'
        });
      }
      const perfisValidos = [
        'ADMIN',
        'GERENTE',
        'ATENDENTE',
        'COZINHA',
        'CLIENTE'
      ];
      if (!perfisValidos.includes(perfil)) {
        return res.status(400).json({
          erro: 'Perfil de usuário inválido.'
        });
      }
      if (req.usuario.perfil === 'GERENTE' && perfil === 'ADMIN') {
        return res.status(403).json({
          erro: 'Gerentes não podem cadastrar administradores.'
        });
      }
      if (req.usuario.perfil === 'GERENTE') {
          if (
            perfil === 'CLIENTE' ||
            Number(id_unidade) !== Number(req.usuario.id_unidade)
          ) {
            return res.status(403).json({
              erro: 'Gerentes só podem cadastrar usuários da própria unidade.'
            });
          }
      }
      const usuarioExistente = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [emailNormalizado]
      );
      if (usuarioExistente.rows.length > 0) {
        return res.status(409).json({
          erro: 'Este e-mail já está cadastrado.'
        });
      }
      const perfisDaUnidade = ['GERENTE', 'ATENDENTE', 'COZINHA'];
      if (perfisDaUnidade.includes(perfil)) {
        if (!id_unidade || !Number.isInteger(Number(id_unidade)) || Number(id_unidade) <= 0) {
          return res.status(400).json({
            erro: 'Informe uma unidade válida para este perfil.'
          });
        }
      }
      if (perfisDaUnidade.includes(perfil)) {
        const unidade = await pool.query(
          'SELECT id FROM unidades WHERE id = $1 AND ativa = true',
          [id_unidade]
        );
        if (unidade.rows.length === 0) {
          return res.status(400).json({
            erro: 'A unidade informada não existe ou está inativa.'
          });
        }
      }
      if (perfil === 'CLIENTE') {
        if (!id_cliente || !Number.isInteger(Number(id_cliente)) || Number(id_cliente) <= 0) {
          return res.status(400).json({
            erro: 'Informe um cliente válido para este perfil.'
          });
        }
        const cliente = await pool.query(
          'SELECT id FROM clientes WHERE id = $1',
          [id_cliente]
        );
        if (cliente.rows.length === 0) {
          return res.status(400).json({
            erro: 'O cliente informado não existe.'
          });
        }
      }
      if (perfil === 'CLIENTE' && id_unidade) {
        return res.status(400).json({
          erro: 'Usuários CLIENTE não devem possuir unidade vinculada.'
        });
      }
      if (perfil === 'ADMIN' && id_unidade) {
        return res.status(400).json({
          erro: 'Administradores não devem possuir unidade vinculada.'
        });
      }
      if (perfil !== 'CLIENTE' && id_cliente) {
        return res.status(400).json({
          erro: 'Apenas usuários CLIENTE podem possuir cliente vinculado.'
        });
      }
      const senhaHash = await bcrypt.hash(senha, 10);
      const resultado = await pool.query(
        `INSERT INTO usuarios
        (nome, email, senha, perfil, id_unidade, id_cliente, ativo, criado_em)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        RETURNING id, nome, email, perfil, id_unidade, id_cliente, ativo`,
        [
          nome,
          emailNormalizado,
          senhaHash,
          perfil,
          id_unidade || null,
          id_cliente || null
        ]
      );
      return res.status(201).json({
        mensagem: 'Usuário cadastrado com sucesso.',
        usuario: resultado.rows[0]
      });
     } catch (erro) {
        console.error('Erro ao cadastrar usuário:', erro.message);
        if (erro.code === '23505') {
          return res.status(409).json({
            erro: 'E-mail ou cliente já vinculado a outro usuário.'
          });
        }
        return res.status(500).json({
          erro: 'Erro interno ao cadastrar usuário.'
        });
      } 
    }
);
export default router;


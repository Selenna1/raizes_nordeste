import pool from './infrastructure/database.js';
import bcrypt from 'bcrypt';

const nome = process.env.ATENDENTE_NOME;
const email = process.env.ATENDENTE_EMAIL;
const senha = process.env.ATENDENTE_SENHA;
const idUnidade = Number(process.env.ATENDENTE_ID_UNIDADE);

if (!nome || !email || !senha || !idUnidade) {
  console.error('Dados do atendente incompletos.');
  process.exit(1);
}
try {
  const existente = await pool.query(
    'SELECT id FROM usuarios WHERE email = $1',
    [email]
  );
  if (existente.rows.length > 0) {
    console.error('Este e-mail já está cadastrado.');
    process.exitCode = 1;
  } else {
    const senhaHash = await bcrypt.hash(senha, 10);
    const resultado = await pool.query(
    `INSERT INTO usuarios
    (id_unidade, nome, email, senha, perfil, ativo, criado_em)
    VALUES ($1, $2, $3, $4, 'ATENDENTE', TRUE, NOW())
    RETURNING id, nome, email, perfil, id_unidade`,
    [idUnidade, nome, email, senhaHash]
    );
    console.log('Atendente de teste criado:', resultado.rows[0]);
  }
} catch (erro) {
  console.error('Erro ao criar atendente:', erro.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
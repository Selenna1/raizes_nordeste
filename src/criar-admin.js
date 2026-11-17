import pool from './infrastructure/database.js';
import bcrypt from 'bcrypt';

const nome = process.env.ADMIN_NOME;
const email = process.env.ADMIN_EMAIL;
const senha = process.env.ADMIN_SENHA;
if (!nome || !email || !senha) {
  console.error('Informe ADMIN_NOME, ADMIN_EMAIL e ADMIN_SENHA no arquivo .env');
  process.exit(1);
}
try {
  const senhaHash = await bcrypt.hash(senha, 10);
  const resultado = await pool.query(
    `INSERT INTO usuarios
    (nome, email, senha, perfil, ativo, criado_em)
    VALUES ($1, $2, $3, 'ADMIN', TRUE, NOW())
    RETURNING id, nome, email, perfil`,
    [nome, email, senhaHash]
  );
  console.log('Administrador criado:', resultado.rows[0]);
} catch (erro) {
  console.error('Erro ao criar administrador:', erro.message);
  process.exitCode = 1;
} finally {
    await pool.end();
}
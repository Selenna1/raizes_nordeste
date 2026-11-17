import jwt from 'jsonwebtoken';

export function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho) {
    return res.status(401).json({
      erro: 'Token de autenticação não informado.'
    });
  }
  const partes = cabecalho.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
    return res.status(401).json({
      erro: 'Formato do token inválido.'
    });
  }
  const token = partes[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (erro) {
    return res.status(401).json({
      erro: 'Token inválido ou expirado.'
    });
  }
}
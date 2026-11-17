export function permitirPerfis(...perfisPermitidos) {
  return (req, res, next) => {
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        erro: 'Você não tem permissão para realizar esta ação.'
      });
    }
    next();
  };
}
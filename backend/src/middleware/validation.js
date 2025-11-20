export const validatePSNId = (req, res, next) => {
  const { psnId } = req.params;
  
  if (!psnId || typeof psnId !== 'string') {
    return res.status(400).json({
      error: 'PSN ID é obrigatório',
      code: 'MISSING_PSN_ID'
    });
  }

  const psnIdRegex = /^[a-zA-Z0-9_-]{3,16}$/;
  if (!psnIdRegex.test(psnId)) {
    return res.status(400).json({
      error: 'PSN ID em formato inválido',
      code: 'INVALID_PSN_ID_FORMAT',
      details: 'O PSN ID deve conter entre 3 e 16 caracteres alfanuméricos, hífens ou underscores'
    });
  }

  next();
};

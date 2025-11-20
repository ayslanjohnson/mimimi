export const errorHandler = (error, req, res, next) => {
  console.error('Erro capturado:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: error.details
    });
  }

  if (error.isAxiosError) {
    return res.status(502).json({
      error: 'Erro na comunicação com a API do PSN',
      details: error.message
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(error.details && { details: error.details })
    });
  }

  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

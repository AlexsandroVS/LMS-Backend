const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Manejar error de email duplicado
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ 
      error: 'El correo electrónico ya está registrado',
      field: 'email'
    });
  }

  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : null
  });
};

module.exports = errorHandler;
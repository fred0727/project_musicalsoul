const handleError = (err, req, res, next) => {
  console.error(err)
  
  const statusCode = err.statusCode || 500;  // Asignar 500 si no hay statusCode
  const message = err.message || 'An unexpected error occurred';
  
  return res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
    // session: req.session  // Si es necesario, puedes volver a agregarlo
  });
}

class ErrorHandler extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode || 500;  // Asignar 500 si no se pasa statusCode
    this.message = message || 'An unexpected error occurred';
  }
}

export { handleError, ErrorHandler };

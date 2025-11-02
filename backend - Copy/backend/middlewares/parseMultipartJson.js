module.exports = function parseMultipartJson(req, res, next) {
  try {
    const raw = req.body && req.body.data;
    if (raw && typeof raw === 'string') {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        req.body = { ...parsed, ...req.body };
        delete req.body.data;
      }
    }
    next();
  } catch (err) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON in "data" field',
    });
  }
}



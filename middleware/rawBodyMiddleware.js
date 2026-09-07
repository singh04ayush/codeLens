const rawBodyMiddleware = (req, res, next) => {
  let data = [];

  req.on('data', chunk => data.push(chunk));

  req.on('end', () => {
    req.rawBody = Buffer.concat(data);

    try {
      req.body = req.rawBody.length > 0
        ? JSON.parse(req.rawBody)
        : {};
    } catch {
      req.body = {};
    }

    next();
  });
};

export default rawBodyMiddleware;
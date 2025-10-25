const { getLoggedOnUser } = require('../util/memoryStore');

module.exports = (req, res, next) => {
  const user = getLoggedOnUser();
  if (!user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
};

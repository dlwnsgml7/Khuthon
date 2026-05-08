const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret';

function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: '유효하지 않은 토큰' });
  }
}

function signToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
}

// 토큰이 있으면 userId 세팅, 없어도 통과
function authOptional(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.slice(7), SECRET);
      req.userId = payload.userId;
    } catch (e) {}
  }
  next();
}

module.exports = { authRequired, authOptional, signToken };

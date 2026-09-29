const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'estoque-secret-development-key-change-in-production';
const TIMEOUT_MIN = parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10) || 30;

function generateToken(user) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    role: user.role,
    exp: Date.now() + TIMEOUT_MIN * 60 * 1000,
  })).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return payload + '.' + signature;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (signature !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const user = verifyToken(authHeader.slice(7));
  if (!user) return res.status(401).json({ error: 'Token inválido ou expirado' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const user = verifyToken(authHeader.slice(7));
  if (!user) return res.status(401).json({ error: 'Token inválido ou expirado' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito a administradores' });
  req.user = user;
  next();
}

function requireAuthGlobal(req, res, next) {
  if (req.path === '/auth/login') return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const user = verifyToken(authHeader.slice(7));
  if (!user) return res.status(401).json({ error: 'Token inválido ou expirado' });
  req.user = user;
  next();
}

module.exports = { generateToken, verifyToken, requireAuth, requireAdmin, requireAuthGlobal };

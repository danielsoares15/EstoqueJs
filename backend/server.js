require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const { generateToken, requireAdmin, requireAuthGlobal } = require('./auth');
const vendedoresRoutes = require('./routes/vendedores');
const produtosRoutes = require('./routes/produtos');
const vendasRoutes = require('./routes/vendas');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Origens permitidas para CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: isProd ? allowedOrigins : '*',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

app.use('/api', requireAuthGlobal);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/vendas', vendasRoutes);

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = require('./database');

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin';

  if (username === adminUser && password === adminPass) {
    const user = { id: null, nome: 'Administrador', username, role: 'admin' };
    const token = generateToken(user);
    return res.json({ user, token });
  }

  const vendedor = db.prepare('SELECT id, nome, username, password FROM vendedores WHERE username = ?').get(username);
  if (vendedor) {
    const isPasswordValid = vendedor.password.startsWith('$2')
      ? bcrypt.compareSync(password, vendedor.password)
      : vendedor.password === password;

    if (isPasswordValid) {
      const user = { id: vendedor.id, nome: vendedor.nome, username: vendedor.username, role: 'vendedor' };
      const token = generateToken(user);
      return res.json({ user, token });
    }
  }

  res.status(401).json({ error: 'Credenciais inválidas' });
});

app.post('/api/upload', requireAdmin, upload.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  res.json({ filename: req.file.filename, url: `/uploads/${req.file.filename}` });
});

app.get('/api/dashboard', (req, res) => {
  const db = require('./database');
  const { vendedor_id } = req.query;
  let condicao = '';
  const params = [];
  if (vendedor_id) {
    condicao = ' WHERE vendedor_id = ?';
    params.push(parseInt(vendedor_id));
  }

  const totalVendas = db.prepare(`SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as receita FROM vendas${condicao}`).get(...params);
  const totalProdutos = db.prepare('SELECT COUNT(*) as total FROM produtos').get();
  const totalVendedores = db.prepare('SELECT COUNT(*) as total FROM vendedores').get();
  const vendasParceladas = db.prepare(`SELECT COUNT(*) as total FROM vendas${condicao ? condicao + ' AND' : ' WHERE'} forma_pagamento = 'parcelado'`).get(...params);

  let pendentesCond = condicao ? `${condicao} AND status_pagamento = 'pendente'` : " WHERE status_pagamento = 'pendente'";
  const pagamentosPendentes = db.prepare(`SELECT COUNT(*) as total FROM vendas${pendentesCond}`).get(...params);

  const vendasPorDia = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as total, SUM(total) as receita
    FROM vendas${condicao}
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(...params);

  const melhorDia = vendasPorDia.reduce((best, d) => !best || d.total > best.total ? d : best, null);

  const melhorVendedor = db.prepare(`
    SELECT vendedor_id, vendedor_nome, COUNT(*) as total_vendas, SUM(total) as total_receita
    FROM vendas GROUP BY vendedor_id ORDER BY total_receita DESC LIMIT 1
  `).get();

  res.json({
    totalVendas: totalVendas.total,
    receita: totalVendas.receita,
    totalProdutos: totalProdutos.total,
    totalVendedores: totalVendedores.total,
    vendasParceladas: vendasParceladas.total,
    pagamentosPendentes: pagamentosPendentes.total,
    vendasPorDia,
    melhorDia,
    melhorVendedor,
  });
});

if (isProd) {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return;
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT} (${isProd ? 'produção' : 'desenvolvimento'})`);
});

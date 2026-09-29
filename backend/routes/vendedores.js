const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAdmin } = require('../auth');

router.get('/', (req, res) => {
  const vendedores = db.prepare('SELECT id, nome, username, created_at FROM vendedores ORDER BY created_at DESC').all();

  const vendasCount = db.prepare('SELECT vendedor_id, COUNT(*) as total_vendas, SUM(total) as total_receita FROM vendas GROUP BY vendedor_id').all();
  const countMap = {};
  vendasCount.forEach((v) => { countMap[v.vendedor_id] = { vendas: v.total_vendas, receita: v.total_receita }; });

  const result = vendedores.map((v) => ({
    ...v,
    total_vendas: countMap[v.id]?.vendas || 0,
    total_receita: countMap[v.id]?.receita || 0,
  }));

  res.json(result);
});

router.get('/:id', (req, res) => {
  const vendedor = db.prepare('SELECT id, nome, username, created_at FROM vendedores WHERE id = ?').get(req.params.id);
  if (!vendedor) return res.status(404).json({ error: 'Vendedor não encontrado' });
  res.json(vendedor);
});

const bcrypt = require('bcryptjs');

router.post('/', requireAdmin, (req, res) => {
  const { nome, username, password } = req.body;
  if (!nome || !username || !password) return res.status(400).json({ error: 'Nome, usuário e senha são obrigatórios' });

  const exists = db.prepare('SELECT id FROM vendedores WHERE username = ?').get(username);
  if (exists) return res.status(400).json({ error: 'Nome de usuário já existe' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO vendedores (nome, username, password) VALUES (?, ?, ?)').run(nome, username, hashedPassword);
  const vendedor = db.prepare('SELECT id, nome, username, created_at FROM vendedores WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(vendedor);
});

router.put('/:id', (req, res) => {
  const { nome, username, password } = req.body;
  if (!nome || !username) return res.status(400).json({ error: 'Nome e usuário são obrigatórios' });

  let sql, params;
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    sql = 'UPDATE vendedores SET nome = ?, username = ?, password = ? WHERE id = ?';
    params = [nome, username, hashedPassword, req.params.id];
  } else {
    sql = 'UPDATE vendedores SET nome = ?, username = ? WHERE id = ?';
    params = [nome, username, req.params.id];
  }

  const result = db.prepare(sql).run(...params);
  if (result.changes === 0) return res.status(404).json({ error: 'Vendedor não encontrado' });

  const vendedor = db.prepare('SELECT id, nome, username, created_at FROM vendedores WHERE id = ?').get(req.params.id);
  res.json(vendedor);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM vendedores WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Vendedor não encontrado' });
  res.status(204).send();
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAdmin } = require('../auth');

router.get('/', (req, res) => {
  const { search } = req.query;
  let produtos;
  if (search) {
    produtos = db.prepare('SELECT * FROM produtos WHERE nome LIKE ? ORDER BY created_at DESC').all(`%${search}%`);
  } else {
    produtos = db.prepare('SELECT * FROM produtos ORDER BY created_at DESC').all();
  }
  res.json(produtos);
});

router.get('/:id', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(produto);
});

router.post('/', requireAdmin, (req, res) => {
  const { nome, preco, quantidade, descricao, imagem } = req.body;
  if (!nome || preco == null) return res.status(400).json({ error: 'Nome e preço são obrigatórios' });

  const result = db.prepare('INSERT INTO produtos (nome, preco, quantidade, descricao, imagem) VALUES (?, ?, ?, ?, ?)').run(
    nome, preco, quantidade || 0, descricao, imagem
  );
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(produto);
});

router.put('/:id', (req, res) => {
  const { nome, preco, quantidade, descricao, imagem } = req.body;
  if (!nome || preco == null) return res.status(400).json({ error: 'Nome e preço são obrigatórios' });

  let sql, params;
  if (imagem !== undefined) {
    sql = 'UPDATE produtos SET nome = ?, preco = ?, quantidade = ?, descricao = ?, imagem = ? WHERE id = ?';
    params = [nome, preco, quantidade || 0, descricao, imagem, req.params.id];
  } else {
    sql = 'UPDATE produtos SET nome = ?, preco = ?, quantidade = ?, descricao = ? WHERE id = ?';
    params = [nome, preco, quantidade || 0, descricao, req.params.id];
  }

  const result = db.prepare(sql).run(...params);
  if (result.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  res.json(produto);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
  res.status(204).send();
});

module.exports = router;

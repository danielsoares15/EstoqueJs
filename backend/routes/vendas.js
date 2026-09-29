const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { forma_pagamento, parcelas, vendedor_id, start_date, end_date, search, status } = req.query;

  let sql = 'SELECT * FROM vendas WHERE 1=1';
  const params = [];

  if (forma_pagamento) {
    sql += ' AND forma_pagamento = ?';
    params.push(forma_pagamento);
  }

  if (parcelas) {
    sql += ' AND parcelas = ?';
    params.push(parseInt(parcelas));
  }

  if (vendedor_id) {
    sql += ' AND vendedor_id = ?';
    params.push(parseInt(vendedor_id));
  }

  if (status) {
    sql += ' AND status_pagamento = ?';
    params.push(status);
  }

  if (start_date) {
    sql += ' AND created_at >= ?';
    params.push(start_date);
  }

  if (end_date) {
    sql += ' AND created_at <= ?';
    params.push(end_date + ' 23:59:59');
  }

  if (search) {
    sql += ' AND (produto_nome LIKE ? OR vendedor_nome LIKE ? OR cliente_nome LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC';

  const vendas = db.prepare(sql).all(...params);
  res.json(vendas);
});

router.get('/:id', (req, res) => {
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id);
  if (!venda) return res.status(404).json({ error: 'Venda não encontrada' });
  res.json(venda);
});

router.post('/', (req, res) => {
  const { produto_id, produto_nome, quantidade, preco_unitario, vendedor_id, vendedor_nome, forma_pagamento, parcelas, cliente_nome, cliente_contato, cliente_endereco } = req.body;

  if (!produto_id || !produto_nome || !quantidade || !preco_unitario || !vendedor_id || !vendedor_nome || !forma_pagamento) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  if (!['avista', 'parcelado'].includes(forma_pagamento)) {
    return res.status(400).json({ error: 'Forma de pagamento inválida' });
  }

  if (forma_pagamento === 'parcelado') {
    if (!cliente_nome || !cliente_contato) {
      return res.status(400).json({ error: 'Para parcelamento, nome e contato do cliente são obrigatórios' });
    }
  }

  const total = preco_unitario * quantidade;
  const numParcelas = forma_pagamento === 'parcelado' ? (parcelas || 2) : 1;

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto_id);
  if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

  if (produto.quantidade < quantidade) {
    return res.status(400).json({ error: 'Quantidade em estoque insuficiente' });
  }

  const statusPagamento = forma_pagamento === 'parcelado' ? 'pendente' : 'confirmado';

  const insertVenda = db.prepare(`
    INSERT INTO vendas (produto_id, produto_nome, quantidade, preco_unitario, total, vendedor_id, vendedor_nome, forma_pagamento, parcelas, cliente_nome, cliente_contato, cliente_endereco, status_pagamento)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateEstoque = db.prepare('UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?');

  const transaction = db.transaction(() => {
    insertVenda.run(produto_id, produto_nome, quantidade, preco_unitario, total, vendedor_id, vendedor_nome, forma_pagamento, numParcelas, cliente_nome, cliente_contato, cliente_endereco, statusPagamento);
    updateEstoque.run(quantidade, produto_id);
  });

  transaction();

  const venda = db.prepare('SELECT * FROM vendas ORDER BY id DESC LIMIT 1').get();
  res.status(201).json(venda);
});

router.put('/:id/confirmar', (req, res) => {
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id);
  if (!venda) return res.status(404).json({ error: 'Venda não encontrada' });
  if (venda.status_pagamento === 'confirmado') return res.status(400).json({ error: 'Pagamento já confirmado' });

  db.prepare("UPDATE vendas SET status_pagamento = 'confirmado', data_confirmacao = datetime('now') WHERE id = ?").run(req.params.id);
  const updated = db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id);
  if (!venda) return res.status(404).json({ error: 'Venda não encontrada' });

  const transaction = db.transaction(() => {
    db.prepare('UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?').run(venda.quantidade, venda.produto_id);
    db.prepare('DELETE FROM vendas WHERE id = ?').run(req.params.id);
  });

  transaction();
  res.status(204).send();
});

module.exports = router;

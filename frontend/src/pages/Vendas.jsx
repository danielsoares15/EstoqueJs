import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { produtosAPI, vendedoresAPI, vendasAPI } from '../api';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import { HiOutlinePlus, HiOutlineShoppingCart } from 'react-icons/hi';

export default function Vendas() {
  const [produtos, setProdutos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    produto_id: '', quantidade: 1, vendedor_id: '', forma_pagamento: 'avista', parcelas: 1,
    cliente_nome: '', cliente_contato: '', cliente_endereco: '',
  });
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [selectedVendedor, setSelectedVendedor] = useState(null);

  const load = async () => {
    const [pRes, vRes, veRes] = await Promise.all([
      produtosAPI.listar(),
      vendedoresAPI.listar(),
      vendasAPI.listar({}),
    ]);
    setProdutos(pRes.data);
    setVendedores(vRes.data);
    setVendas(veRes.data.slice(0, 10));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ produto_id: '', quantidade: 1, vendedor_id: '', forma_pagamento: 'avista', parcelas: 1, cliente_nome: '', cliente_contato: '', cliente_endereco: '' });
    setSelectedProduto(null);
    setSelectedVendedor(null);
    setModalOpen(true);
  };

  const handleProdutoChange = (id) => {
    setForm({ ...form, produto_id: id });
    const p = produtos.find((x) => x.id === parseInt(id));
    setSelectedProduto(p);
  };

  const handleVendedorChange = (id) => {
    setForm({ ...form, vendedor_id: id });
    const v = vendedores.find((x) => x.id === parseInt(id));
    setSelectedVendedor(v);
  };

  const total = selectedProduto ? selectedProduto.preco * form.quantidade : 0;
  const valorParcela = form.forma_pagamento === 'parcelado' && form.parcelas > 0 ? total / form.parcelas : total;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduto || !selectedVendedor) return;

    try {
      const payload = {
        produto_id: selectedProduto.id,
        produto_nome: selectedProduto.nome,
        quantidade: form.quantidade,
        preco_unitario: selectedProduto.preco,
        vendedor_id: selectedVendedor.id,
        vendedor_nome: selectedVendedor.nome,
        forma_pagamento: form.forma_pagamento,
        parcelas: form.forma_pagamento === 'parcelado' ? form.parcelas : 1,
      };
      if (form.forma_pagamento === 'parcelado') {
        payload.cliente_nome = form.cliente_nome;
        payload.cliente_contato = form.cliente_contato;
        payload.cliente_endereco = form.cliente_endereco;
      }
      await vendasAPI.criar(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao registrar venda');
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold text-white">
          Vendas
        </motion.h1>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-600/20 transition-all">
          <HiOutlinePlus size={20} /> Nova Venda
        </motion.button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineShoppingCart /> Últimas Vendas
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-sm border-b border-gray-800">
                <th className="text-left py-3 px-4">Produto</th>
                <th className="text-left py-3 px-4">Vendedor</th>
                <th className="text-center py-3 px-4">Qtd</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-center py-3 px-4">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v, i) => (
                <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4 text-white">{v.produto_nome}</td>
                  <td className="py-3 px-4 text-gray-400">{v.vendedor_nome}</td>
                  <td className="py-3 px-4 text-center text-gray-400">{v.quantidade}</td>
                  <td className="py-3 px-4 text-right text-blue-400 font-medium">R$ {v.total?.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${v.forma_pagamento === 'avista' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {v.forma_pagamento === 'avista' ? 'À vista' : `${v.parcelas}x`}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {vendas.length === 0 && <p className="text-gray-500 text-center py-8">Nenhuma venda registrada</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Venda">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Produto</label>
            <select value={form.produto_id} onChange={(e) => handleProdutoChange(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione...</option>
              {produtos.filter((p) => p.quantidade > 0).map((p) => (
                <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco?.toFixed(2)} ({p.quantidade} disp.)</option>
              ))}
            </select>
            {selectedProduto && (
              <p className="text-gray-500 text-xs mt-1">Disponível: {selectedProduto.quantidade} unidades</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantidade</label>
              <input type="number" min="1" max={selectedProduto?.quantidad || 999} value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: parseInt(e.target.value) || 1 })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preço Unit.</label>
              <p className="text-white font-medium py-2">R$ {selectedProduto?.preco?.toFixed(2) || '0,00'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Vendedor</label>
            <select value={form.vendedor_id} onChange={(e) => handleVendedorChange(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione...</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Forma de Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ ...form, forma_pagamento: 'avista' })}
                className={`py-2 px-4 rounded-lg border transition-all ${form.forma_pagamento === 'avista' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                À vista
              </button>
              <button type="button" onClick={() => setForm({ ...form, forma_pagamento: 'parcelado' })}
                className={`py-2 px-4 rounded-lg border transition-all ${form.forma_pagamento === 'parcelado' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                Parcelado
              </button>
            </div>
          </div>

          {form.forma_pagamento === 'parcelado' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Número de Parcelas</label>
                <select value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n}>{n}x</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do Cliente <span className="text-red-400">*</span></label>
                <input type="text" value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome completo" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contato <span className="text-red-400">*</span></label>
                <input type="text" value={form.cliente_contato} onChange={(e) => setForm({ ...form, cliente_contato: e.target.value })} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Telefone / WhatsApp" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Endereço <span className="text-gray-600">(opcional)</span></label>
                <input type="text" value={form.cliente_endereco} onChange={(e) => setForm({ ...form, cliente_endereco: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rua, número, bairro" />
              </div>
            </motion.div>
          )}

          <div className="bg-gray-800 rounded-lg p-4 space-y-1">
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Total</span>
              <span className="text-white font-semibold">R$ {total.toFixed(2)}</span>
            </div>
            {form.forma_pagamento === 'parcelado' && (
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Valor por parcela</span>
                <span className="text-blue-400 font-semibold">{form.parcelas}x de R$ {valorParcela.toFixed(2)}</span>
              </div>
            )}
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-blue-600/20">
            Registrar Venda
          </motion.button>
        </form>
      </Modal>
    </div>
  );
}

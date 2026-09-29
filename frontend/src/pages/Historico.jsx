import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { vendasAPI, vendedoresAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi';

export default function Historico() {
  const [vendas, setVendas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [filtros, setFiltros] = useState({
    forma_pagamento: '', parcelas: '', vendedor_id: '', search: '', start_date: '', end_date: '', status: '',
  });

  const loadVendedores = async () => {
    const res = await vendedoresAPI.listar();
    setVendedores(res.data);
  };

  const load = async () => {
    setLoading(true);
    const params = {};
    Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });

    if (!isAdmin) {
      params.vendedor_id = user.id;
    }

    const res = await vendasAPI.listar(params);
    setVendas(res.data);
    setLoading(false);
  };

  useEffect(() => { loadVendedores(); }, []);

  useEffect(() => { load(); }, []);

  const handleFilter = () => { load(); };

  const handleClear = () => {
    setFiltros({ forma_pagamento: '', parcelas: '', vendedor_id: '', search: '', start_date: '', end_date: '' });
    setTimeout(load, 0);
  };

  const handleConfirm = async (id) => {
    if (confirm('Confirmar recebimento do pagamento?')) {
      await vendasAPI.confirmar(id);
      load();
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta venda? O estoque será reajustado.')) {
      await vendasAPI.excluir(id);
      load();
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('pt-BR');

  return (
    <div>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold text-white mb-8">
        Histórico de Vendas
        {!isAdmin && <span className="text-base text-gray-500 font-normal ml-3">(minhas vendas)</span>}
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineFilter className="text-blue-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Buscar</label>
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input type="text" value={filtros.search} onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                placeholder="Produto ou vendedor..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Pagamento</label>
            <select value={filtros.forma_pagamento} onChange={(e) => setFiltros({ ...filtros, forma_pagamento: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas</option>
              <option value="avista">À vista</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Parcelas</label>
            <select value={filtros.parcelas} onChange={(e) => setFiltros({ ...filtros, parcelas: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
            </select>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vendedor</label>
              <select value={filtros.vendedor_id} onChange={(e) => setFiltros({ ...filtros, vendedor_id: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Data Início</label>
            <input type="date" value={filtros.start_date} onChange={(e) => setFiltros({ ...filtros, start_date: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Data Fim</label>
            <input type="date" value={filtros.end_date} onChange={(e) => setFiltros({ ...filtros, end_date: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex items-end gap-2">
            <button onClick={handleFilter}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all flex-1">
              Filtrar
            </button>
            <button onClick={handleClear}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-4 py-2 rounded-lg text-sm transition-all">
              Limpar
            </button>
          </div>
        </div>
      </motion.div>

      {loading ? <Loading /> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-sm border-b border-gray-800">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Cliente</th>
                  <th className="text-left py-3 px-4">Produto</th>
                  <th className="text-left py-3 px-4">Vendedor</th>
                  <th className="text-center py-3 px-4">Qtd</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-center py-3 px-4">Pagamento</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-center py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v, i) => (
                  <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${v.status_pagamento === 'pendente' ? 'bg-yellow-500/5' : ''}`}>
                    <td className="py-3 px-4 text-gray-500 text-sm">#{v.id}</td>
                    <td className="py-3 px-4">
                      {v.cliente_nome ? (
                        <div>
                          <p className="text-white text-sm">{v.cliente_nome}</p>
                          <p className="text-gray-500 text-xs">{v.cliente_contato}</p>
                        </div>
                      ) : <span className="text-gray-600">-</span>}
                    </td>
                    <td className="py-3 px-4 text-white">{v.produto_nome}</td>
                    <td className="py-3 px-4 text-gray-400">{v.vendedor_nome}</td>
                    <td className="py-3 px-4 text-center text-gray-400">{v.quantidade}</td>
                    <td className="py-3 px-4 text-right text-blue-400 font-medium">R$ {v.total?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${v.forma_pagamento === 'avista' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {v.forma_pagamento === 'avista' ? 'À vista' : `${v.parcelas}x`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${v.status_pagamento === 'confirmado' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {v.status_pagamento === 'confirmado' ? 'Confirmado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">{formatDate(v.created_at)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isAdmin && v.status_pagamento === 'pendente' && (
                          <button onClick={() => handleConfirm(v.id)} title="Confirmar pagamento"
                            className="text-green-500 hover:text-green-400 transition-colors">
                            <HiOutlineCheckCircle size={18} />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleDelete(v.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                            <HiOutlineTrash size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && vendas.length === 0 && (
            <p className="text-gray-500 text-center py-12">Nenhuma venda encontrada com esses filtros</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

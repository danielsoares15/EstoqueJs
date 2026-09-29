import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { vendedoresAPI } from '../api';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineStar } from 'react-icons/hi';

export default function Vendedores() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nome: '', username: '', password: '' });

  const load = () => {
    setLoading(true);
    vendedoresAPI.listar().then((res) => {
      setVendedores(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const best = vendedores.reduce((best, v) => !best || (v.total_receita || 0) > (best.total_receita || 0) ? v : best, null);

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: '', username: '', password: '' });
    setModalOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({ nome: v.nome, username: v.username, password: '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = editing
      ? (form.password ? form : { nome: form.nome, username: form.username })
      : form;
    if (editing) {
      await vendedoresAPI.atualizar(editing.id, data);
    } else {
      await vendedoresAPI.criar(data);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este vendedor?')) {
      await vendedoresAPI.excluir(id);
      load();
    }
  };

  if (loading && !vendedores.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold text-white">
          Vendedores
        </motion.h1>
        {isAdmin && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-600/20 transition-all">
            <HiOutlinePlus size={20} /> Novo
          </motion.button>
        )}
      </div>

      {best && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <HiOutlineStar className="text-yellow-400 flex-shrink-0" size={28} />
          <div>
            <p className="text-yellow-400 font-semibold">Melhor Vendedor</p>
            <p className="text-white">{best.nome} — <span className="text-blue-400">{best.total_vendas || 0} vendas</span> · <span className="text-green-400">R$ {Number(best.total_receita || 0).toFixed(2)}</span></p>
          </div>
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-sm border-b border-gray-800">
              <th className="text-left py-3 px-4">Nome</th>
              <th className="text-left py-3 px-4">Usuário</th>
              <th className="text-center py-3 px-4">Vendas</th>
              <th className="text-right py-3 px-4">Receita</th>
              {isAdmin && <th className="text-right py-3 px-4">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {vendedores.map((v, i) => {
              const isBest = best && best.id === v.id;
              return (
                <motion.tr key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${isBest ? 'bg-yellow-500/5' : ''}`}>
                  <td className="py-3 px-4 text-white font-medium">
                    {v.nome}
                    {isBest && <HiOutlineStar className="inline ml-2 text-yellow-400" size={16} />}
                  </td>
                  <td className="py-3 px-4 text-gray-400">{v.username}</td>
                  <td className="py-3 px-4 text-center text-gray-400">{v.total_vendas || 0}</td>
                  <td className="py-3 px-4 text-right text-green-400">R$ {Number(v.total_receita || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(v)} className="text-gray-400 hover:text-blue-400 transition-colors mr-3">
                          <HiOutlinePencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(v.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                          <HiOutlineTrash size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && vendedores.length === 0 && (
        <p className="text-gray-500 text-center py-12">Nenhum vendedor encontrado</p>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Vendedor' : 'Novo Vendedor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Usuário para login</label>
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Senha {editing && '(deixe em branco para manter)'}
            </label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all">
            {editing ? 'Atualizar' : 'Criar'}
          </motion.button>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { produtosAPI, uploadAPI } from '../api';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlinePhotograph } from 'react-icons/hi';

export default function Produtos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nome: '', preco: '', quantidade: '', descricao: '', imagem: '' });
  const [uploadingImg, setUploadingImg] = useState(false);

  const load = () => {
    setLoading(true);
    produtosAPI.listar(search || undefined).then((res) => {
      setProdutos(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: '', preco: '', quantidade: '', descricao: '', imagem: '' });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ nome: p.nome, preco: p.preco, quantidade: p.quantidade, descricao: p.descricao || '', imagem: p.imagem || '' });
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await uploadAPI.imagem(file);
      setForm({ ...form, imagem: res.data.filename });
    } catch {
      alert('Erro ao fazer upload da imagem');
    }
    setUploadingImg(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, preco: parseFloat(form.preco), quantidade: parseInt(form.quantidade) || 0 };
    if (editing) {
      await produtosAPI.atualizar(editing.id, data);
    } else {
      await produtosAPI.criar(data);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await produtosAPI.excluir(id);
      load();
    }
  };

  if (loading && !produtos.length) return <Loading />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold text-white">
          Produtos
        </motion.h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
              className="w-full sm:w-64 bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {isAdmin && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-600/20 transition-all">
              <HiOutlinePlus size={20} /> Novo
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtos.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all">
            {p.imagem && (
              <div className="h-40 overflow-hidden bg-gray-800">
                <img src={`/uploads/${p.imagem}`} alt={p.nome} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{p.nome}</h3>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${p.quantidade > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {p.quantidade} em estoque
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-400 mb-3">R$ {p.preco?.toFixed(2)}</p>
              {p.descricao && <p className="text-gray-500 text-sm mb-4">{p.descricao}</p>}
              {isAdmin && (
                <div className="flex gap-2 pt-3 border-t border-gray-800">
                  <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors text-sm">
                    <HiOutlinePencil size={16} /> Editar
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors text-sm ml-auto">
                    <HiOutlineTrash size={16} /> Excluir
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && produtos.length === 0 && (
        <p className="text-gray-500 text-center py-12">Nenhum produto encontrado</p>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preço</label>
              <input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantidade</label>
              <input type="number" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Imagem</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-700 transition-all text-gray-300">
                <HiOutlinePhotograph size={20} />
                {uploadingImg ? 'Enviando...' : 'Escolher imagem'}
                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
              </label>
              {form.imagem && <span className="text-green-400 text-sm">Imagem selecionada</span>}
            </div>
            {form.imagem && (
              <img src={`/uploads/${form.imagem}`} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={uploadingImg}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50">
            {editing ? 'Atualizar' : 'Criar'}
          </motion.button>
        </form>
      </Modal>
    </div>
  );
}

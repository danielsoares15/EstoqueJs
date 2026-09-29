import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineShoppingCart, HiOutlineCurrencyDollar, HiOutlineCube,
  HiOutlineUserGroup, HiOutlineCreditCard, HiOutlineStar, HiOutlineCalendar,
  HiOutlineClock,
} from 'react-icons/hi';
import Loading from '../components/Loading';

const cards = [
  { key: 'totalVendas', label: 'Total de Vendas', icon: HiOutlineShoppingCart, color: 'from-blue-500 to-blue-600' },
  { key: 'receita', label: 'Receita Total', icon: HiOutlineCurrencyDollar, color: 'from-green-500 to-green-600', prefix: 'R$ ', decimal: true },
  { key: 'totalProdutos', label: 'Produtos', icon: HiOutlineCube, color: 'from-purple-500 to-purple-600' },
  { key: 'totalVendedores', label: 'Vendedores', icon: HiOutlineUserGroup, color: 'from-orange-500 to-orange-600' },
  { key: 'vendasParceladas', label: 'Vendas Parceladas', icon: HiOutlineCreditCard, color: 'from-pink-500 to-pink-600' },
  { key: 'pagamentosPendentes', label: 'Pagamentos Pendentes', icon: HiOutlineClock, color: 'from-orange-500 to-orange-600' },
];

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function Calendar({ vendasPorDia, melhorDia }) {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const diasNoMes = Array.from({ length: ultimoDia }, (_, i) => i + 1);

  const vendasMap = {};
  vendasPorDia?.forEach((d) => {
    vendasMap[d.date] = d;
  });

  const melhorData = melhorDia?.date;

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAno(ano - 1); } else { setMes(mes - 1); }
  };
  const mesSeguinte = () => {
    if (mes === 11) { setMes(0); setAno(ano + 1); } else { setMes(mes + 1); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HiOutlineCalendar className="text-blue-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Calendário de Vendas</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={mesAnterior} className="text-gray-400 hover:text-white text-lg">&lt;</button>
          <span className="text-white font-medium">{meses[mes]} {ano}</span>
          <button onClick={mesSeguinte} className="text-gray-400 hover:text-white text-lg">&gt;</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div key={d} className="text-gray-500 text-xs py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: primeiroDia }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {diasNoMes.map((dia) => {
          const dateStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          const venda = vendasMap[dateStr];
          const isMelhor = dateStr === melhorData;
          const temVenda = !!venda;

          return (
            <motion.div
              key={dia}
              whileHover={{ scale: 1.1 }}
              className={`
                relative py-2 rounded-lg text-sm cursor-pointer transition-all
                ${isMelhor ? 'bg-yellow-500 text-black font-bold ring-2 ring-yellow-400' : ''}
                ${temVenda && !isMelhor ? 'bg-blue-600/30 text-blue-300' : ''}
                ${!temVenda && !isMelhor ? 'text-gray-600' : ''}
              `}
              title={temVenda ? `${venda.total} venda(s) - R$ ${venda.receita?.toFixed(2)}` : 'Sem vendas'}
            >
              {dia}
              {temVenda && (
                <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isMelhor ? 'bg-black' : 'bg-blue-400'}`} />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600/30 border border-blue-400" /> Com venda
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 ring-1 ring-yellow-400" /> Mais vendas
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-transparent border border-gray-700" /> Sem venda
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const params = user?.role === 'vendedor' ? user.id : undefined;
    dashboardAPI.dados(params).then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-8">
        Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {cards.map((card, index) => {
          const value = data?.[card.key] ?? 0;
          const displayValue = card.decimal ? Number(value).toFixed(2) : value;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{card.prefix || ''}{displayValue}</p>
                </div>
                <div className={`bg-gradient-to-br ${card.color} p-3 rounded-xl shadow-lg`}>
                  <card.icon size={24} className="text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Calendar vendasPorDia={data?.vendasPorDia} melhorDia={data?.melhorDia} />

        {data?.melhorVendedor && user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineStar className="text-yellow-400" size={24} />
              <h2 className="text-lg font-semibold text-white">Melhor Vendedor</h2>
            </div>
            <div className="text-center py-4">
              <div className="text-2xl font-bold text-yellow-400">{data.melhorVendedor.vendedor_nome}</div>
              <div className="text-gray-400 mt-2">
                <span className="text-blue-400 font-semibold">{data.melhorVendedor.total_vendas}</span> vendas
              </div>
              <div className="text-gray-400">
                Receita: <span className="text-green-400 font-semibold">R$ {Number(data.melhorVendedor.total_receita).toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('estoque_token');
  if (stored) {
    config.headers.Authorization = `Bearer ${stored}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      localStorage.removeItem('estoque_user');
      localStorage.removeItem('estoque_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const vendedoresAPI = {
  listar: () => api.get('/vendedores'),
  buscar: (id) => api.get(`/vendedores/${id}`),
  criar: (data) => api.post('/vendedores', data),
  atualizar: (id, data) => api.put(`/vendedores/${id}`, data),
  excluir: (id) => api.delete(`/vendedores/${id}`),
};

export const produtosAPI = {
  listar: (search) => api.get('/produtos', { params: { search } }),
  buscar: (id) => api.get(`/produtos/${id}`),
  criar: (data) => api.post('/produtos', data),
  atualizar: (id, data) => api.put(`/produtos/${id}`, data),
  excluir: (id) => api.delete(`/produtos/${id}`),
};

export const vendasAPI = {
  listar: (filtros) => api.get('/vendas', { params: filtros }),
  buscar: (id) => api.get(`/vendas/${id}`),
  criar: (data) => api.post('/vendas', data),
  confirmar: (id) => api.put(`/vendas/${id}/confirmar`),
  excluir: (id) => api.delete(`/vendas/${id}`),
};

export const dashboardAPI = {
  dados: (vendedor_id) => api.get('/dashboard', { params: { vendedor_id } }),
};

export const uploadAPI = {
  imagem: (file) => {
    const form = new FormData();
    form.append('imagem', file);
    return api.post('/upload', form);
  },
};

export default api;

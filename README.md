# 📦 Sistema de Gestão de Estoque & Vendas

Um sistema completo, moderno e responsivo para controle de estoque, frente de vendas e gestão de equipe comercial. Desenvolvido com **React + Tailwind CSS** no frontend e **Node.js + SQLite (Better-SQLite3)** no backend.

---

## ✨ Funcionalidades Principais

- 📊 **Dashboard Analítico**:
  - Cards de KPIs com faturamento total, volume de vendas, estoque e pagamentos pendentes.
  - Calendário interativo de vendas indicando dias com atividade e destacando o dia de maior receita.
  - Ranking em tempo real do vendedor destaque (visível para administradores).
- 🏷️ **Controle de Estoque e Produtos**:
  - Cadastro, edição, busca e exclusão de produtos.
  - Suporte a upload de fotos do produto.
  - Atualização automática de saldo de estoque com baixa e estorno garantidos por transações ACID.
- 💳 **Frente de Vendas (PDV)**:
  - Registro ágil de vendas à vista ou parceladas.
  - Captura de dados do cliente (para controle de parcelamentos e entregas).
  - Status de pagamento (`confirmado` ou `pendente`) com fluxo de baixa e confirmação manual.
- 👥 **Gestão de Equipe & Permissões**:
  - Perfis diferenciados: **Administrador** (acesso completo) e **Vendedor** (visão restrita às suas próprias vendas e produtos).
  - Senhas criptografadas com `bcryptjs`.
  - Métrica de receita e quantidade de vendas acumuladas por cada vendedor.
- 🔍 **Histórico & Filtros Avançados**:
  - Consulta de vendas com filtros combinados: período (data inicial e final), vendedor, forma de pagamento e busca por nome.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com **Vite** (alta velocidade de desenvolvimento e build otimizado)
- **Tailwind CSS** (design system escuro, limpo e responsivo)
- **Framer Motion** (transições suaves e micro-interações fluidas)
- **React Router Dom v6** (gerenciamento de rotas e rotas autenticadas)
- **Axios** (cliente HTTP com interceptors para injeção de Bearer Token e redirecionamento de sessão)
- **React Icons** (iconografia moderna)

### Backend
- **Node.js** & **Express**
- **Better-SQLite3** (banco local de alto desempenho em modo WAL - *Write-Ahead Logging*)
- **Transações ACID (`db.transaction`)** (garantia de integridade para baixa e estorno de estoque)
- **Bcrypt.js** (hashing seguro de credenciais)
- **Multer** (upload e armazenamento local de imagens)
- **Autenticação HMAC-SHA256** (tokens com assinatura e controle de expiração)

---

## 📂 Estrutura do Projeto

```text
├── backend/
│   ├── routes/             # Rotas da API (produtos, vendas, vendedores)
│   ├── uploads/            # Armazenamento das fotos de produtos
│   ├── auth.js             # Middleware de autenticação e geração de tokens
│   ├── database.js         # Inicialização do SQLite e criação das tabelas
│   ├── server.js           # Ponto de entrada do Express
│   ├── .env.example        # Exemplo de variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, modais, loaders e toasts
│   │   ├── context/        # Contexto de autenticação global (AuthContext)
│   │   ├── pages/          # Dashboard, Produtos, Vendas, Histórico, Vendedores, Login
│   │   └── api.js          # Configuração do Axios e chamadas à API
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── scripts/
│   ├── popular_produtos.js # Script de seed para baixar imagens e criar 100 produtos
│   └── deploy.ps1          # Script PowerShell para build e empacotamento de produção
└── .gitignore
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- Gerenciador de pacotes `npm`

---

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

### 2. Configurar e Iniciar o Backend
```bash
cd backend
npm install

# Copie o arquivo de exemplo de ambiente
cp .env.example .env

# Inicie o servidor em modo de desenvolvimento
npm run dev
```
> O backend estará rodando em: `http://localhost:3001`

---

### 3. Configurar e Iniciar o Frontend
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
> O frontend estará rodando em: `http://localhost:5173`

---

### 4. (Opcional) Popular o Banco com Produtos de Teste
Para testar o sistema com catálogo de 100 produtos e fotos reais baixadas automaticamente:
```bash
node scripts/popular_produtos.js
```

---

## 🔑 Credenciais Padrão de Acesso

Ao inicializar o sistema pela primeira vez, utilize o usuário administrador padrão:

| Perfil | Usuário | Senha |
| :--- | :--- | :--- |
| **Administrador** | `admin` | `admin` |

*(As credenciais de administrador podem ser alteradas no arquivo `backend/.env` através das chaves `ADMIN_USERNAME` e `ADMIN_PASSWORD`)*.

---

## 📦 Produção e Build

Para gerar os arquivos estáticos otimizados do frontend:
```bash
cd frontend
npm run build
```

Para empacotar a aplicação pronta para VPS ou Cloud Panel:
```powershell
./scripts/deploy.ps1
```

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se livre para usar, modificar e distribuir.

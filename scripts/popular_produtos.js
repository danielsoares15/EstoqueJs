const path = require('path');
const fs = require('fs');
const https = require('https');

const backendDir = path.join(__dirname, '..', 'backend');
const Database = require(path.join(backendDir, 'node_modules', 'better-sqlite3'));

const dbPath = path.join(backendDir, 'estoque.db');
const uploadsDir = path.join(backendDir, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database(dbPath);

const NOME_PRODUTOS = [
  'Sofá 3 Lugares', 'Mesa de Jantar', 'Cadeira Design', 'Estante Modular',
  'Cama Queen Size', 'Guarda-roupa Casal', 'Criado Mudo', 'Escrivaninha',
  'Poltrona Conforto', 'Mesa de Centro', 'Rack para TV', 'Cadeira de Escritório',
  'Sofá 2 Lugares', 'Cabeceira Estofada', 'Aparador Moderno', 'Painel TV',
  'Estante Aço', 'Banco Couro', 'Cadeira Baloiço', 'Mesa Lateral',
  'Sofá Cama', 'Cômoda 6 Gavetas', 'Armário Cozinha', 'Penteadeira',
  'Cristaleira', 'Mesa Escritório', 'Cadeira Gamer', 'Sofá Retrátil',
  'Beliche', 'Berço Conversível', 'Poltrona Leitura', 'Mesa Canto',
  'Cabideiro', 'Sapateira', 'Cadeira Praia', 'Banco Jardim',
  'Mesa Piquenique', 'Rede Descanso', 'Espreguiçadeira', 'Hamelon',
  'Sofá Inflável', 'Puff Redondo', 'Banco Baixo', 'Mesa Tabuleiro',
  'Cadeira Dobrável', 'Estante Parede', 'Armário Serviço', 'Balcão Cozinha',
  'Cadeira Bar', 'Mesa Bar', 'Sofá Chaise', 'Cama Solteiro',
  'Escrivaninha Infantil', 'Guarda-roupa Solteiro', 'Penteadeira Infantil',
  'Mesa Estudo', 'Cadeira Estudo', 'Sofá Modular', 'Mesa TV',
  'Roupeiro', 'Criado Mudo Casal', 'Poltrona Reclinável', 'Mesa Auxiliar',
  'Aparador Entrada', 'Cadeira Jantar', 'Banco Madeira', 'Estante Livros',
  'Armário Banheiro', 'Cadeira Praiano', 'Mesa Dobrável', 'Puff Quadrado',
  'Sofá 4 Lugares', 'Mesa Redonda', 'Cadeira Palha', 'Estante TV',
  'Cama Box Casal', 'Guarda-roupa 8 Portas', 'Criado Mudo 2 Gavetas',
  'Cadeira Fixa', 'Poltrona Giratória', 'Mesa Console', 'Rack Chão',
  'Escrivaninha Canto', 'Cadeira Empilhável', 'Estante Aço', 'Armário Aéreo',
  'Mesa Reunião', 'Cadeira Visita', 'Sofá Executivo', 'Mesa Computador',
  'Cadeira Secretária', 'Arquivo Aço', 'Armário Arquivo', 'Mesa Impressora',
  'Cadeira Operacional', 'Sofá Recepção', 'Poltrona Espera', 'Mesa Apoio',
  'Bancada Trabalho', 'Cadeira Laboratório', 'Armário Vestiário', 'Mesa Copa',
];

const TOTAL = 100;

function downloadImagem(url, dest) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (r) => {
          const file = fs.createWriteStream(dest);
          r.pipe(file);
          file.on('finish', () => { file.close(); resolve(true); });
        }).on('error', () => resolve(false));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    }).on('error', () => resolve(false));
  });
}

(async () => {
  try {
    console.log('Baixando imagens...');
    const downloads = [];
    for (let i = 0; i < TOTAL; i++) {
      const dest = path.join(uploadsDir, `product-${i + 1}.jpg`);
      if (!fs.existsSync(dest)) {
        const url = `https://picsum.photos/seed/prod${i + 1}/640/480`;
        downloads.push(downloadImagem(url, dest));
      }
    }
    await Promise.all(downloads);
    console.log(`${downloads.length} imagens baixadas.\n`);

    console.log('Inserindo produtos no banco...');
    const insert = db.prepare(`
      INSERT INTO produtos (nome, preco, quantidade, descricao, imagem)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertAll = db.transaction(() => {
      for (let i = 0; i < TOTAL; i++) {
        const nome = NOME_PRODUTOS[i] || `Produto ${i + 1}`;
        const preco = Number((Math.random() * 4900 + 100).toFixed(2));
        const quantidade = Math.floor(Math.random() * 50) + 1;
        const descricao = `${nome} de alta qualidade, ideal para sua casa.`;
        const filename = `product-${i + 1}.jpg`;
        insert.run(nome, preco, quantidade, descricao, filename);
        console.log(`[${i + 1}/${TOTAL}] ${nome} — R$ ${preco.toFixed(2)} (${quantidade} un)`);
      }
    });

    insertAll();
    console.log(`\nConcluído! ${TOTAL} produtos inseridos.`);
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    db.close();
  }
})();

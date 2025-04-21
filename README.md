🚀 Startup Arena (Docker-Only)

Um torneio de startups com backend em Node.js/Express e banco PostgreSQL — tudo “one‑click” via Docker.

---

🛠 Pré‑requisitos
- Docker ≥ 20.x  
- Docker Compose ≥ 1.29.x  

---

📂 Estrutura
.
├── Dockerfile
├── docker-compose.yml
├── .env
├── db
│   └── init.sql       ← script para criar a tabela EMPRESAS
├── package.json
├── server.js
├── db.js
├── public
│   └── index.html
│   └── CSS/
│   └── assets/
└── script.js

---

⚙️ Configuração
1. **.env**  
   copie ou crie na raiz:
   CONNECTION_STRING=postgres://postgres:postgres@db:5432/teste-db
   PORT=3000

2. **db/init.sql**  
   crie (ou ajuste) em `./db/init.sql`:
   CREATE TABLE IF NOT EXISTS EMPRESAS (
     empresa_id   INT PRIMARY KEY,
     nome         TEXT NOT NULL,
     slogan       TEXT NOT NULL,
     ano_fund     CHAR(4) NOT NULL,
     pts_totais   INT DEFAULT 0
   );

---

🐳 Rodando com Docker
1. **Build & up**  
   docker-compose up --build

2. **Verificar**  
   abra http://localhost:3000

3. **Logs & gerenciamento**  
   parar: Ctrl+C ou docker-compose down  
   logs: docker-compose logs -f app

---

Endpoints
GET    /empresas
POST   /empresas
DELETE /empresas/:id
PATCH  /empresas/:id/points

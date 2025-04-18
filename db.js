const { Pool } = require('pg');

module.exports = { 
  selectCompany, 
  insertCompany, 
  deleteCompany,
  updateCompanyPoints
}

let pool;

async function connect() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.CONNECTION_STRING,
    });

    const client = await pool.connect();
    console.log("✅ Conectado ao PostgreSQL!");
    const res = await client.query("SELECT NOW()");
    console.log(res.rows[0]);
    client.release();
  }

  return pool;
}

async function selectCompany() {
  const client = await connect();
  const res = await client.query('SELECT * FROM EMPRESAS');
  return res.rows;
}

async function insertCompany(company) {
  const client = await connect();

  const sql = 
    'INSERT INTO EMPRESAS (EMPRESA_ID, NOME, SLOGAN, ANO_FUND) VALUES ($1, $2, $3, $4);';

  const values = [
    company.EMPRESA_ID, 
    company.NOME, 
    company.SLOGAN,
    company.ANO_FUND,
  ];
  return await client.query(sql, values);
}

async function deleteCompany(id) {
  const client = await connect();
  const sql = 'DELETE FROM EMPRESAS WHERE EMPRESA_ID = $1;';
  const result = await client.query(sql, [id]);
  return result.rowCount; // Retorna quantas linhas foram afetadas
}

async function updateCompanyPoints(empresaID, delta) {
  const client = await connect();
  const sql = `
    UPDATE EMPRESAS
    SET pts_totais = pts_totais + $1
    WHERE empresa_id = $2;
  `;
  return await client.query(sql, [delta, empresaID]);
}
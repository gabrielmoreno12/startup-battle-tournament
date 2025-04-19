require('dotenv').config();
const express = require('express');
const db = require('./db');
const app = express();

// Middleware para parsear JSON e servir arquivos estáticos
app.use(express.json());
app.use(express.static('public'));

// Endpoint para listar todas as empresas
app.get('/empresas', async (req, res) => {
  try {
    const empresas = await db.selectCompany();
    res.json(empresas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar empresas: ' + err.message });
  }
});

// Endpoint para inserir uma empresa
app.post('/empresas', async (req, res) => {
  try {
    const company = {
      EMPRESA_ID: req.body.EMPRESA_ID,
      NOME: req.body.NOME,
      SLOGAN: req.body.SLOGAN,
      ANO_FUND: req.body.ANO_FUND,
    };
    await db.insertCompany(company);
    res.status(201).json({ message: 'Empresa inserida com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao inserir empresa: ' + err.message });
  }
});

// Endpoint para deletar uma empresa
app.delete('/empresas/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deletedRows = await db.deleteCompany(id);

    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada!' });
    }

    res.json({ message: 'Empresa deletada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar empresa: ' + err.message });
  }
});

app.patch('/empresas/:id/points', async (req, res) => {
  try {
    const empresaID = parseInt(req.params.id, 10);
    const { delta } = req.body;               // espera { delta: número }
    await db.updateCompanyPoints(empresaID, delta);
    res.json({ message: 'Pontos atualizados!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar pontos: ' + err.message });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

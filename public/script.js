'use strict';

let round = 1;
let participants = [];
let winners = [];
let allStartups = [];
let tournamentChampion = null;

// —————————————————————————————
// Quando o DOM estiver pronto...
// —————————————————————————————
window.addEventListener('DOMContentLoaded', async () => {
  // 1) Carrega lista lateral
  await carregarEmpresas();

  // 2) Carrega do backend, inicializa stats e guarda em allStartups
  const fetched = await fetchEmpresas();
  allStartups = fetched.map(e => ({
    ...e,
    pts_totais: e.pts_totais || 0,
    stats: {
      convincing_pitch: 0,
      bugs: 0,
      good_user_traction: 0,
      angry_investor: 0,
      fake_news: 0,
      sharkFights: 0
    }
  }));

  // 3) Start: define participantes iniciais e dispara primeira renderização
  const startBtn = document.querySelector('.start');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      participants = allStartups.slice();
      winners = [];
      round = 1;
      renderBattles(true);
    });
  }
});

// —————————————————————————————
// Helpers de API
// —————————————————————————————
async function fetchEmpresas() {
  const res = await fetch('/empresas');
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function patchPoints(id, delta) {
  await fetch(`/empresas/${id}/points`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta })
  });
}

// —————————————————————————————
// Inserir / Deletar / Listar empresas (lista lateral)
// —————————————————————————————
async function carregarEmpresas() {
  const container = document.querySelector('.companies__row');
  if (!container) return;
  const empresas = await fetchEmpresas();
  empresas.sort((a, b) => a.empresa_id - b.empresa_id);
  container.innerHTML = empresas.map(e => `
    <div class="company">
      <p><strong>ID:</strong> ${e.empresa_id}</p>
      <p><strong>Nome:</strong> ${e.nome}</p>
      <p><strong>Slogan:</strong> ${e.slogan}</p>
      <p><strong>Ano fundação:</strong> ${e.ano_fund}</p>
      <hr>
    </div>
  `).join('');

  // habilita/desabilita botões conforme regras
  const count = empresas.length;
  document.querySelector('.form--insert__company .form__btn')
    .disabled = count >= 8;
  document.querySelector('.start')
    .disabled = !(count === 4 || count === 8);
}

// —————————————————————————————
// INSERT
// —————————————————————————————
document.querySelector('.form--insert__company').addEventListener('submit', async ev => {
  ev.preventDefault();
  const nextID = await generate_ID();
  const company = {
    EMPRESA_ID: nextID,
    NOME: document.querySelector('.form__input--nome').value.trim(),
    SLOGAN: document.querySelector('.form__input--slogan').value.trim(),
    ANO_FUND: document.querySelector('.form__input--ano').value.trim()
  };
  try {
    const res = await fetch('/empresas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
    const msg = document.getElementById('message--insert');
    const obj = await res.json();
    if (res.ok) {
      msg.textContent = obj.message; msg.classList.remove('error');
      await carregarEmpresas();
    } else {
      msg.textContent = obj.error; msg.classList.add('error');
    }
  } catch (err) {
    const msg = document.getElementById('message--insert');
    msg.textContent = 'Erro: ' + err.message; msg.classList.add('error');
  }
});

// —————————————————————————————
// DELETE
// —————————————————————————————
document.querySelector('.form--delete__company').addEventListener('submit', async ev => {
  ev.preventDefault();
  const id = document.querySelector('.form__input--id').value.trim();
  if (!id) return alert('Informe um ID válido');
  try {
    const res = await fetch(`/empresas/${id}`, { method: 'DELETE' });
    const msg = document.getElementById('message--delete');
    const obj = await res.json();
    if (res.ok) {
      msg.textContent = obj.message; msg.classList.remove('error');
      await carregarEmpresas();
    } else {
      msg.textContent = obj.error; msg.classList.add('error');
    }
  } catch (err) {
    const msg = document.getElementById('message--delete');
    msg.textContent = 'Erro: ' + err.message; msg.classList.add('error');
  }
});

async function generate_ID() {
  const empresas = await fetchEmpresas();
  const ids = empresas.map(e => e.empresa_id).sort((a, b) => a - b);
  let next = 1;
  for (let id of ids) {
    if (id === next) next++;
    else if (id > next) break;
  }
  return next;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getStageName(count) {
  switch (count) {
    case 8: return 'QUARTAS DE FINAL';
    case 4: return 'SEMIFINAL';
    case 2: return 'FINAL';
    default: return '';
  }
}

/////////////////////////////////////////
/* RENDERIZA BATALHAS EM DUPLAS E ROUNDS */
/////////////////////////////////////////

async function renderBattles(clearPage = false) {
  // 1) Se clearPage, monta header + container + botão
  if (clearPage) {
    const stage = getStageName(participants.length);
    document.querySelector('.body').innerHTML = `
      <h2 class="round-header">
        Rodada ${round}${stage ? ' – ' + stage : ''}
      </h2>
      <div class="battles__container"></div>
      <button class="next-round" disabled>Avançar para próxima rodada</button>
    `;
    document.querySelector('.next-round')
      .addEventListener('click', () => {
        participants = winners.slice();
        winners = [];
        round++;
        renderBattles(true);
      });
  }

  winners = [];
  const battleArea = document.querySelector('.battles__container');
  battleArea.innerHTML = '';

  // Se for final (apenas 2 participantes)
  if (participants.length === 2) {
    criarDupla(participants[0], participants[1], battleArea);
    return;
  }

  // Senão: embaralha e monta pares
  const shuffled = shuffle(participants.slice());
  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i], b = shuffled[i + 1];
    if (!b) break;
    criarDupla(a, b, battleArea);
  }
}

function criarDupla(a, b, container) {
  const div = document.createElement('div');
  div.className = 'divBattle';
  div.style.cursor = 'pointer';
  div.innerHTML = `
    <div class="companyBattle" id="companyA-${a.empresa_id}">
      <h3>${a.nome}</h3>
      <p><strong>Pontuação:</strong> <span class="pts-a">${a.pts_totais}</span></p>
    </div>
    <p><strong>VS</strong></p>
    <div class="companyBattle" id="companyB-${b.empresa_id}">
      <h3>${b.nome}</h3>
      <p><strong>Pontuação:</strong> <span class="pts-b">${b.pts_totais}</span></p>
    </div>
    <hr>
  `;
  container.appendChild(div);
  bindBattleModal(div, a, b);
}

function bindBattleModal(divBattle, a, b) {
  divBattle.addEventListener('click', () => {
    // Cria overlay e modal...
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-content'; modal.style.position = 'relative';
    const closeBtn = document.createElement('span');
    closeBtn.className = 'modal-close'; closeBtn.innerHTML = '×';
    modal.appendChild(closeBtn);

    // Formulário
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="modal-battle">
        <div class="companyBattle" id="modal-companyA-${a.empresa_id}">
          <h3>${a.nome}</h3>
          <p><strong>Pontuação:</strong> ${a.pts_totais}</p>
          <div class="checkboxes">
            <label><input type="checkbox" name="a_score1" value="6" /> Pitch convincente (+6)</label>
            <label><input type="checkbox" name="a_score2" value="3" /> Boa tração de usuários (+3)</label>
            <label><input type="checkbox" name="a_score3" value="-4" /> Produto com bugs (–4)</label>
            <label><input type="checkbox" name="a_score4" value="-6" /> Investidor irritado (–6)</label>
            <label><input type="checkbox" name="a_score5" value="-8" /> Fake news no pitch (–8)</label>
          </div>
        </div>
        <p><strong>VS</strong></p>
        <div class="companyBattle" id="modal-companyB-${b.empresa_id}">
          <h3>${b.nome}</h3>
          <p><strong>Pontuação:</strong> ${b.pts_totais}</p>
          <div class="checkboxes">
            <label><input type="checkbox" name="b_score1" value="6" /> Pitch convincente (+6)</label>
            <label><input type="checkbox" name="b_score2" value="3" /> Boa tração de usuários (+3)</label>
            <label><input type="checkbox" name="b_score3" value="-4" /> Produto com bugs (–4)</label>
            <label><input type="checkbox" name="b_score4" value="-6" /> Investidor irritado (–6)</label>
            <label><input type="checkbox" name="b_score5" value="-8" /> Fake news no pitch (–8)</label>
          </div>
        </div>
      </div>
      <button type="submit">Salvar</button>
    `;
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function closeModal() {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    }
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => e.target === overlay && closeModal());

    form.addEventListener('submit', async ev => {
      ev.preventDefault();

      // 1) Coleta checks e atualiza stats
      const aChecks = Array.from(form.querySelectorAll('input[name^="a_score"]:checked'));
      const bChecks = Array.from(form.querySelectorAll('input[name^="b_score"]:checked'));
      function updateStats(s, checks) {
        checks.forEach(chk => {
          switch (chk.value) {
            case '6': s.stats.convincing_pitch++; break;
            case '3': s.stats.good_user_traction++; break;
            case '-4': s.stats.bugs++; break;
            case '-6': s.stats.angry_investor++; break;
            case '-8': s.stats.fake_news++; break;
          }
        });
      }
      updateStats(a, aChecks);
      updateStats(b, bChecks);

      // 2) Soma dos deltas
      const deltaA = aChecks.reduce((sum, c) => sum + Number(c.value), 0);
      const deltaB = bChecks.reduce((sum, c) => sum + Number(c.value), 0);

      // 3) Persiste e atualiza UI
      await patchPoints(a.empresa_id, deltaA);
      await patchPoints(b.empresa_id, deltaB);
      a.pts_totais += deltaA;
      b.pts_totais += deltaB;
      divBattle.querySelector('.pts-a').textContent = a.pts_totais;
      divBattle.querySelector('.pts-b').textContent = b.pts_totais;

      // 4) Decide empate → Shark Fight
      let champ = null;
      if (a.pts_totais > b.pts_totais) {
        champ = a;
      } else if (b.pts_totais > a.pts_totais) {
        champ = b;
      } else {
        const sharkWinner = Math.random() < 0.5 ? a : b;
        await patchPoints(sharkWinner.empresa_id, 2);
        sharkWinner.pts_totais += 2;
        sharkWinner.stats.sharkFights++;
        divBattle.querySelector(sharkWinner === a ? '.pts-a' : '.pts-b')
          .textContent = sharkWinner.pts_totais;
        const wDiv = divBattle.querySelector(
          sharkWinner === a
            ? `#companyA-${a.empresa_id}`
            : `#companyB-${b.empresa_id}`
        );
        wDiv.querySelector('h3').textContent += ' (decidido por Shark Fight!)';
        champ = sharkWinner;
      }

      // 5) Bônus +30 ao campeão
      await patchPoints(champ.empresa_id, 30);
      champ.pts_totais += 30;
      divBattle.querySelector(champ === a ? '.pts-a' : '.pts-b')
        .textContent = champ.pts_totais;

      // 6) Marca vencedor e bloqueia clique
      const selId = champ === a
        ? `#companyA-${a.empresa_id}`
        : `#companyB-${b.empresa_id}`;
      divBattle.querySelector(selId).classList.add('company-winner');
      divBattle.style.pointerEvents = 'none';
      winners.push(champ);

      closeModal();
      await carregarEmpresas();

      // 7) Habilita próxima rodada
      const totalBattles = Math.floor(participants.length / 2);
      if (winners.length === totalBattles) {
        document.querySelector('.next-round').disabled = false;
      }

      // 8) Se final, exibe campeão
      if (participants.length === 2 && winners.length === 1) {
        tournamentChampion = winners[0];
        showWinner();
      }
    });
  });
}

// —————————————————————————————
// Mostrar campeão / Relatório 
// —————————————————————————————
function showWinner() {
  const champ = tournamentChampion;
  document.querySelector('.body').innerHTML = `
    <h1>VENCEDOR</h1>
    <div class="companyWinner">
      <h2>${champ.nome}</h2>
      <p>${champ.slogan}</p>
      <p>Pontuação Final: ${champ.pts_totais}</p>
    </div>
    <button class="relatorio">Relatório de batalhas</button>
    <button class="again">Jogar novamente</button>
  `;
  document.querySelector('.relatorio').addEventListener('click', showReport);
  document.querySelector('.again').addEventListener('click', resetDB);
}

function showReport() {
  const body = document.querySelector('.body');
  body.innerHTML = `
    <h1>Relatório de Batalhas</h1>
    <table class="report">
      <thead>
        <tr>
          <th>Rank</th><th>Startup</th><th>Pontuação</th>
          <th>Pitches</th><th>Bugs</th><th>Trações</th>
          <th>Inv. Irritados</th><th>Fake News</th><th>Shark Fights</th><th>Slogan</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <button class="back">Voltar</button>
  `;
  allStartups.sort((x, y) => y.pts_totais - x.pts_totais);
  const tbody = body.querySelector('tbody');
  allStartups.forEach((s, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${s.nome}</td>
      <td>${s.pts_totais}</td>
      <td>${s.stats.convincing_pitch}</td>
      <td>${s.stats.bugs}</td>
      <td>${s.stats.good_user_traction}</td>
      <td>${s.stats.angry_investor}</td>
      <td>${s.stats.fake_news}</td>
      <td>${s.stats.sharkFights}</td>
      <td>${s.slogan}</td>
    `;
    tbody.appendChild(row);
  });
  document.querySelector('.back').addEventListener('click', showWinner);
}

// —————————————————————————————
// Quando o torneio acaba, apaga tudo do banco e reinicia a tela
// —————————————————————————————
async function resetDB() {
  try {
    // 1) Apaga cada empresa via DELETE /empresas/:id
    const deletes = allStartups.map(s =>
      fetch(`/empresas/${s.empresa_id}`, { method: 'DELETE' })
    );
    await Promise.all(deletes);

    // 2) Limpa estado local
    allStartups = [];
    participants = [];
    winners = [];

    // 3) Volta pra tela inicial recarregando a página
    window.location.reload();
  } catch (err) {
    console.error('Erro ao resetar DB:', err);
  }
}

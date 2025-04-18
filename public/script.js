// public/script.js

let round = 1;
let participants = [];
let winners = [];
let allStartups = [];
let tournamentChampion = null;

// Quando o DOM estiver pronto...
window.addEventListener('DOMContentLoaded', async () => {
  await carregarEmpresas();

  // carrega todas as startups e inicializa estatísticas
  allStartups = await fetchEmpresas();
  allStartups.forEach(s => {
    s.stats = { pitches: 0, bugs: 0, tractions: 0, investors: 0, penalities: 0 };
  });

  // define os participantes iniciais
  participants = [...allStartups];

  const startBtn = document.querySelector('.start');
  if (startBtn) {
    startBtn.addEventListener('click', () => renderBattles(true));
  }
});

// —————————————————————————————
// Helpers de API
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
// Inserir / Deletar / Listar empresas
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
async function enable_to_start() {
  const empresas = await fetchEmpresas();
  const count = empresas.length;
  document.querySelector('.form--insert__company .form__btn')
    .disabled = count >= 8;
  document.querySelector('.start')
    .disabled = !(count >= 4 && count <= 8 && count % 2 === 0);
}
async function carregarEmpresas() {
  const container = document.querySelector('.companies__row');
  if (!container) return;
  try {
    const empresas = await fetchEmpresas();
    empresas.sort((a, b) => a.empresa_id - b.empresa_id);
    container.innerHTML = '';
    for (let e of empresas) {
      const div = document.createElement('div');
      div.className = 'company';
      div.innerHTML = `
        <p><strong>ID:</strong> ${e.empresa_id}</p>
        <p><strong>Nome:</strong> ${e.nome}</p>
        <p><strong>Slogan:</strong> ${e.slogan}</p>
        <p><strong>Ano fundação:</strong> ${e.ano_fund}</p>
        <hr>
      `;
      container.appendChild(div);
    }
    await enable_to_start();
  } catch (err) {
    console.error('Erro ao carregar empresas:', err);
  }
}

// Inserção
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
      carregarEmpresas();
    } else {
      msg.textContent = obj.error; msg.classList.add('error');
    }
  } catch (err) {
    const msg = document.getElementById('message--insert');
    msg.textContent = 'Erro: ' + err.message; msg.classList.add('error');
  }
});

// Deleção
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
      carregarEmpresas();
    } else {
      msg.textContent = obj.error; msg.classList.add('error');
    }
  } catch (err) {
    const msg = document.getElementById('message--delete');
    msg.textContent = 'Erro: ' + err.message; msg.classList.add('error');
  }
});

// —————————————————————————————
// Batalhas em duplas & rodadas
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function getStageName(count) {
  if (count === 8) return 'QUARTAS DE FINAL';
  if (count === 4) return 'SEMIFINAL';
  if (count === 2) return 'FINAL';
  return '';
}

async function renderBattles(clearPage = false) {
  // ***** NÃO reatribuímos participants aqui! *****

  if (clearPage) {
    const stage = getStageName(participants.length);
    document.querySelector('.body').innerHTML = `
      <h2 class="round-header">Rodada ${round}${stage ? ' – ' + stage : ''}</h2>
      <div class="battles__container"></div>
      <button class="next-round" disabled>Avançar para próxima rodada</button>
    `;
    document.querySelector('.next-round')
      .addEventListener('click', async () => {
        // apenas mantemos os vencedores
        participants = winners.slice();
        winners = [];
        round++;
        await renderBattles(true);
      });
  }

  winners = [];
  const battleArea = document.querySelector('.battles__container');
  battleArea.innerHTML = '';

  // fase final?
  if (participants.length === 2) {
    const [a, b] = participants;
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
    battleArea.appendChild(div);
    bindBattleModal(div, a, b);
    return;
  }

  // demais fases
  const shuffled = shuffle([...participants]);
  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i], b = shuffled[i + 1];
    if (!b) break;
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
    battleArea.appendChild(div);
    bindBattleModal(div, a, b);
  }
}

function bindBattleModal(divBattle, a, b) {
  divBattle.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.position = 'relative';
    const closeBtn = document.createElement('span');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    modal.appendChild(closeBtn);

    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="modal-battle">
        <div class="companyBattle" id="modal-companyA-${a.empresa_id}">
          <h3>${a.nome}</h3>
          <p><strong>Pontuação:</strong> ${a.pts_totais}</p>
          <div class="checkboxes">
            <label><input type="checkbox" name="a_score1" value="6" /> Pitch convincente (+6)</label>
            <label><input type="checkbox" name="a_score2" value="3" /> Tração (+3)</label>
            <label><input type="checkbox" name="a_score3" value="-4" /> Bugs (–4)</label>
            <label><input type="checkbox" name="a_score4" value="-6" /> Inv. irritado (–6)</label>
            <label><input type="checkbox" name="a_score5" value="-8" /> Penalidade (–8)</label>
          </div>
        </div>
        <p><strong>VS</strong></p>
        <div class="companyBattle" id="modal-companyB-${b.empresa_id}">
          <h3>${b.nome}</h3>
          <p><strong>Pontuação:</strong> ${b.pts_totais}</p>
          <div class="checkboxes">
            <label><input type="checkbox" name="b_score1" value="6" /> Pitch convincente (+6)</label>
            <label><input type="checkbox" name="b_score2" value="3" /> Tração (+3)</label>
            <label><input type="checkbox" name="b_score3" value="-4" /> Bugs (–4)</label>
            <label><input type="checkbox" name="b_score4" value="-6" /> Inv. irritado (–6)</label>
            <label><input type="checkbox" name="b_score5" value="-8" /> Penalidade (–8)</label>
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
      const aChecks = Array.from(form.querySelectorAll('input[name^="a_score"]:checked'));
      const bChecks = Array.from(form.querySelectorAll('input[name^="b_score"]:checked'));

      // atualiza estatísticas
      function updateStats(s, checks) {
        checks.forEach(chk => {
          switch (chk.value) {
            case '6': s.stats.pitches++; break;
            case '3': s.stats.tractions++; break;
            case '-4': s.stats.bugs++; break;
            case '-6': s.stats.investors++; break;
            case '-8': s.stats.penalities++; break;
          }
        });
      }
      updateStats(a, aChecks);
      updateStats(b, bChecks);

      const deltaA = aChecks.reduce((sum, c) => sum + Number(c.value), 0);
      const deltaB = bChecks.reduce((sum, c) => sum + Number(c.value), 0);

      try {
        // aplica deltas iniciais
        await patchPoints(a.empresa_id, deltaA);
        await patchPoints(b.empresa_id, deltaB);
        a.pts_totais += deltaA;
        b.pts_totais += deltaB;
        divBattle.querySelector('.pts-a').textContent = a.pts_totais;
        divBattle.querySelector('.pts-b').textContent = b.pts_totais;

        let champ = null;

        if (a.pts_totais > b.pts_totais) {
          champ = a;
        } else if (b.pts_totais > a.pts_totais) {
          champ = b;
        } else {
          // empate → Shark Fight
          const sharkWinner = (Math.random() < 0.5 ? a : b);
          await patchPoints(sharkWinner.empresa_id, 2);
          sharkWinner.pts_totais += 2;
          const spanSel = sharkWinner === a ? '.pts-a' : '.pts-b';
          divBattle.querySelector(spanSel).textContent = sharkWinner.pts_totais;

          // atualiza o <h3> do vencedor com o textinho
          const winnerDiv = divBattle.querySelector(
            sharkWinner === a ? `#companyA-${a.empresa_id}` : `#companyB-${b.empresa_id}`
          );
          const h3 = winnerDiv.querySelector('h3');
          h3.textContent = `${h3.textContent} (decidido por Shark Fight!)`;

          champ = sharkWinner;
        }

        // bônus de vencedor +30
        await patchPoints(champ.empresa_id, 30);
        champ.pts_totais += 30;
        const finalSpan = divBattle.querySelector(champ === a ? '.pts-a' : '.pts-b');
        finalSpan.textContent = champ.pts_totais;

        const idSel = champ === a
          ? `#companyA-${a.empresa_id}`
          : `#companyB-${b.empresa_id}`;
        divBattle.querySelector(idSel).classList.add('company-winner');
        divBattle.style.pointerEvents = 'none';
        winners.push(champ);

        closeModal();
        await carregarEmpresas();

        // habilita “próxima rodada” quando todas as duplas tiverem vencedor
        const totalBattles = Math.floor(participants.length / 2);
        if (winners.length === totalBattles) {
          document.querySelector('.next-round').disabled = false;
        }

        // se for final do torneio, exibe campeão...
        if (participants.length === 2 && winners.length === 1) {
          tournamentChampion = winners[0];
          document.querySelector('.body').innerHTML = `
            <h1>VENCEDOR</h1>
            <div class="companyWinner">
              <h2>${tournamentChampion.nome}</h2>
              <p>${tournamentChampion.slogan}</p>
              <p>Pontuação Final: ${tournamentChampion.pts_totais}</p>
            </div>
            <button class="relatorio">Relatório de batalhas</button>
          `;
          document.querySelector('.relatorio').addEventListener('click', showReport);
        }
      } catch (err) {
        console.error(err);
        closeModal();
      }
    });
  });
}


// Mostrar vencedor novamente
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
  `;
  document.querySelector('.relatorio').addEventListener('click', showReport);
}

// Relatório final com ranking e botão Voltar
function showReport() {
  const body = document.querySelector('.body');
  body.innerHTML = `
    <h1>Relatório de Batalhas</h1>
    <table class="report">
      <thead>
        <tr>
          <th>Ranking</th>
          <th>Startup</th>
          <th>Pontuação Final</th>
          <th>Pitches</th>
          <th>Bugs</th>
          <th>Trações</th>
          <th>Inv. Irritados</th>
          <th>Penalidades</th>
          <th>Slogan</th>
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
      <td>${s.stats.pitches}</td>
      <td>${s.stats.bugs}</td>
      <td>${s.stats.tractions}</td>
      <td>${s.stats.investors}</td>
      <td>${s.stats.penalities}</td>
      <td>${s.slogan}</td>
    `;
    tbody.appendChild(row);
  });
  document.querySelector('.back').addEventListener('click', showWinner);
}

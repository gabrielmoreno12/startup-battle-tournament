'use strict';

/////////////////////////////////////////
// Market Events Deck
/////////////////////////////////////////
const marketEvents = [
  { name: "Viral Trend", description: "Sua startup explodiu nas redes sociais!", delta: +5, icon: "📈" },
  { name: "Hackers Invadiram", description: "Um ataque cibernético tirou seu site do ar.", delta: -4, icon: "💻" },
  { name: "Investidor Anjo", description: "Um investidor generoso entrou com capital extra!", delta: +8, icon: "😇" },
  { name: "Crise Regulatória", description: "Uma nova lei complicou seu modelo de negócio.", delta: -6, icon: "⚖️" },
  { name: "Matéria em Revista", description: "Você foi destaque em uma grande publicação!", delta: +3, icon: "📰" },
  { name: "Avanço Tecnológico", description: "Seu time lançou um recurso revolucionário.", delta: +4, icon: "🤖" }
];

let round = 1;
let participants = [];
let winners = [];
let allStartups = [];
let tournamentChampion = null;

function openHelpDialog(titleHTML, textHTML, mascoteNum) {
  // cria overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  // balão de fala
  const modal = document.createElement('div');
  modal.className = 'modal-content help-dialog';
  modal.style.position = 'relative';

  // personagem
  const char = document.createElement('img');
  char.src = 'assets/imgs/karin_sama.webp';
  char.alt = 'Guia da Startup Arena';
  char.className = `help-character v${mascoteNum}`;
  modal.appendChild(char);

  // botão fechar
  const closeBtn = document.createElement('span');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '&times;';
  modal.appendChild(closeBtn);

  // título
  const title = document.createElement('h2');
  title.textContent = titleHTML;
  modal.appendChild(title);

  // conteúdo dinâmico
  const ul = document.createElement('ul');
  ul.style.textAlign = 'left';
  ul.innerHTML = textHTML;
  modal.appendChild(ul);

  // seta “caixa de diálogo” (triângulo e estilos já no CSS)
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  modal.style.background = '#fff';
  modal.style.borderRadius = '8px';
  modal.style.padding = '1rem';
  modal.style.maxWidth = '90%';
  modal.style.maxHeight = '90%';
  modal.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  modal.style.zIndex = '2';

  // triângulo no balão
  modal.style.position = 'relative';
  modal.insertAdjacentHTML('beforeend', `
      <style>
        .modal-content::after {
          content: "";
          position: absolute;
          bottom: -12px;
          left: 2rem;
          border-width: 12px 12px 0 12px;
          border-style: solid;
          border-color: #fff transparent transparent transparent;
        }
      </style>
    `);

  function close() {
    document.body.removeChild(overlay);
    document.body.style.overflow = '';
  }
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => e.target === overlay && close());
}


// —————————————————————————————
// DOMContentLoaded: monta lista lateral e cadastra Start
// —————————————————————————————
window.addEventListener('DOMContentLoaded', async () => {
  const welcome = document.getElementById('welcome');
  const mainApp = document.getElementById('main-app');
  const btnWelcome = document.getElementById('btn-start');
  const btnHelp = document.getElementById('btn-help');
  const btnMarketEvents = document.getElementById('btn-market-events');

  // 1) Esconde a aplicação principal no carregamento
  mainApp.style.display = 'none';

  // 2) Ação do botão de boas‑vindas: esconde a tela de welcome e mostra o app
  btnWelcome.addEventListener('click', () => {
    welcome.style.display = 'none';
    mainApp.style.display = 'block';
    openHelpDialog(
      `Pronto para começar?`,
      `Primeiro, <b>faça o cadastro</b> de algumas startups!`,
      2
    );
  });

  // 3) Carrega lista lateral (inserir/deletar antes de iniciar)
  await carregarEmpresas();

  // 4) Botão “Começar batalhas”
  document.querySelector('.start').addEventListener('click', async () => {
    const fresh = await fetchEmpresas();
    allStartups = fresh.map(e => ({
      ...e,
      pts_totais: e.pts_totais || 0,
      stats: {
        convincing_pitch: 0, bugs: 0, good_user_traction: 0,
        angry_investor: 0, fake_news: 0, sharkFights: 0,
        marketBonus: 0, marketOnus: 0
      }
    }));
    participants = [...allStartups];
    winners = [];
    round = 1;
    await renderBattles(true);
    openHelpDialog(
      `Agora começam as batalhas!`,
      `<b>Escolha a batalha</b> que você deseja administrar e <b>realize as pontuações <br>necessárias</b>, o vencedor de cada batalha passsa para próxima fase.`,
      3
    );
  });

  btnMarketEvents.addEventListener('click', () => {
    const marketEventsInfo = `
      <p>São eventos aleatórios que acontecem toda rodada, <b>beneficiando</b> ou <b>prejudicando</b> as startups:</p>
      😇 <b>Investidor Anjo</b>: Um investidor generoso entrou com capital extra! (+8 pts)<br>
      📈 <b>Viral Trend</b>: Sua startup explodiu nas redes sociais! (+5 pts)<br>
      🤖 <b>Avanço Tecnológico</b>: Seu time lançou um recurso revolucionário. (+4 pts)<br>
      📰 <b>Matéria em Revista</b>: Você foi destaque em uma grande publicação! (+3 pts)<br>
      💻 <b>Hackers Invadiram</b>: Um ataque cibernético tirou seu site do ar. (-4 pts)<br>
      ⚖️ <b>Crise Regulatória</b>: Uma nova lei complicou seu modelo de negócio. (-6 pts)<br>
    `;
    openHelpDialog(`Market Events!`, marketEventsInfo, 4);
  })

  // 5) Botão de Help: abre modal em formato de balão + personagem
  btnHelp.addEventListener('click', () => {
    const title = `Olá, Jurado!`;
    const content = `
      Hoje vou ser seu guia, para comerçarmos que tal conhecermos as regras? <br>
      <br>
      <li>Você pode cadastrar 4 ou 8 startups para participar do torneio.</li>
      <li>Cada batalha possue eventos que podem ser anotados para as startups:</li>
      <ul>
        <li>Pitch convincente: +6 pontos</li>
        <li>Boa tração de usuários: +3 pontos</li>
        <li>Produto com bugs: –4 pontos</li>
        <li>Investidor irritado: –6 pontos</li>
        <li>Fake news no pitch: –8 pontos</li>
      </ul>
      <li>Se der empate, rola o Shark Fight (aleatório +2 pontos).</li>
      <li>Cada fase premia o vencedor com +30 pontos extras.</li>
      <li><b>Market Events aleatórios acontecem antes do pitch</b> (bônus ou ônus).</li>
      <li>Ao fim, <b>pode ser gerado um relatório e você pode baixar em CSV/Excel.</b></li>
    `;
    openHelpDialog(title, content, 1);
  });
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
// Inserir / Deletar / Listar empresas (lateral)
// —————————————————————————————
async function carregarEmpresas() {
  const container = document.querySelector('.companies__row');
  if (!container) return;
  const empresas = await fetchEmpresas();
  empresas.sort((a, b) => a.empresa_id - b.empresa_id);
  container.innerHTML = empresas.map(e => `
    <div class="company">
      <p><strong>ID:</strong> ${e.empresa_id}</p>
      <p>${e.nome}</p>
      <p>${e.slogan}</p>
      <p><strong>Ano fundação:</strong> ${e.ano_fund}</p>
    </div>
  `).join('');

  const count = empresas.length;
  document.querySelector('.form--insert__company .form__btn')
    .disabled = count >= 8;
  document.querySelector('.start')
    .disabled = !(count === 4 || count === 8);
}

// exibe a .message fixa no canto por 2s
function toast(text, isError = false) {
  const msgEl = document.querySelector('.message');
  msgEl.textContent = text;
  msgEl.classList.toggle('error', isError);
  msgEl.classList.add('show');
  setTimeout(() => msgEl.classList.remove('show'), 2000);
}

// —————————————————————————————
// INSERT
// —————————————————————————————
document.querySelector('.form--insert__company')
  .addEventListener('submit', async ev => {
    ev.preventDefault();

    // Monta o objeto a ser enviado
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
      const obj = await res.json();

      if (res.ok) {
        // Atualiza listagem lateral
        await carregarEmpresas();
        toast(obj.message, false);
      } else {
        toast(obj.error, true);
      }
    } catch (err) {
      toast('Erro: ' + err.message, true);
    }
  });


// —————————————————————————————
// DELETE
// —————————————————————————————
document.querySelector('.form--delete__company')
  .addEventListener('submit', async ev => {
    ev.preventDefault();

    const id = document.querySelector('.form__input--id').value.trim();
    if (!id) {
      toast('Informe um ID válido', true);
      return;
    }

    try {
      const res = await fetch(`/empresas/${id}`, { method: 'DELETE' });
      const obj = await res.json();

      if (res.ok) {
        await carregarEmpresas();
        toast(obj.message, false);
      } else {
        toast(obj.error, true);
      }
    } catch (err) {
      toast('Erro: ' + err.message, true);
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
  if (clearPage) {
    const stage = getStageName(participants.length);
    document.querySelector('.body').innerHTML = `
      <h2 class="round-header">Rodada ${round}<span class="stage">${stage ? ' – ' + stage : ''}<span></h2>
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

  if (participants.length === 2) {
    criarDupla(participants[0], participants[1], battleArea);
    return;
  }

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
      <h3 class="name-header">${a.nome}</h3>
      <p>Pontuação: <span class="pts-a">${a.pts_totais}</span></p>
    </div>
    <p class="vs-p"><strong>VS</strong></p>
    <div class="companyBattle" id="companyB-${b.empresa_id}">
      <h3 class="name-header">${b.nome}</h3>
      <p>Pontuação: <span class="pts-b">${b.pts_totais}</span></p>
    </div>
    <hr>
  `;
  container.appendChild(div);
  bindBattleModal(div, a, b);
}

function bindBattleModal(divBattle, a, b) {
  divBattle.addEventListener('click', () => {
    // 1) sorteia um Market Event e quem será afetado
    const evtIndex = Math.floor(Math.random() * marketEvents.length);
    const evt = marketEvents[evtIndex];
    const target = Math.random() < 0.5 ? a : b;
    const other = target === a ? b : a;

    // 2) cria overlay e modal container
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.position = 'relative';

    // 3) botão fechar
    const closeBtn = document.createElement('span');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    modal.appendChild(closeBtn);

    // 4) monta o form sem market-event no topo
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="modal-battle">
        <div class="companyBattle" id="modal-companyA-${a.empresa_id}">
          <h3>${a.nome}</h3>
          <p>Pontuação: ${a.pts_totais}</p>
          <div class="checkboxes">
            <label><input type="checkbox" name="a_score1" value="6" /> Pitch convincente (+6)</label>
            <label><input type="checkbox" name="a_score2" value="3" /> Boa tração de usuários (+3)</label>
            <label><input type="checkbox" name="a_score3" value="-4" /> Produto com bugs (–4)</label>
            <label><input type="checkbox" name="a_score4" value="-6" /> Investidor irritado (–6)</label>
            <label><input type="checkbox" name="a_score5" value="-8" /> Fake news no pitch (–8)</label>
          </div>
        </div>
        <p class="vs-p"><strong>VS</strong></p>
        <div class="companyBattle" id="modal-companyB-${b.empresa_id}">
          <h3>${b.nome}</h3>
          <p>Pontuação: ${b.pts_totais}</p>
          <div class="checkboxes">
            <label><input type="checkbox" name="b_score1" value="6" /> Pitch convincente (+6)</label>
            <label><input type="checkbox" name="b_score2" value="3" /> Boa tração de usuários (+3)</label>
            <label><input type="checkbox" name="b_score3" value="-4" /> Produto com bugs (–4)</label>
            <label><input type="checkbox" name="b_score4" value="-6" /> Investidor irritado (–6)</label>
            <label><input type="checkbox" name="b_score5" value="-8" /> Fake news no pitch (–8)</label>
          </div>
        </div>
      </div>
      <button class="btn-salvar" type="submit">✓</button>
    `;
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // 5) injetar market-event dentro da div afetada, acima do <h3>
    const targetId = target === a
      ? `#modal-companyA-${a.empresa_id}`
      : `#modal-companyB-${b.empresa_id}`;
    const targetDiv = modal.querySelector(targetId);
    const evtP = document.createElement('p');
    evtP.className = `market-event ${evt.delta > 0 ? 'bonus' : 'onus'}`;
    evtP.innerHTML = `
      ${evt.icon}
      <strong>${evt.name}</strong>: ${evt.description}
      (${evt.delta > 0 ? 'Bônus' : 'Ônus'} ${evt.delta > 0 ? '+' : ''}${evt.delta} pts)
    `;
    const h3 = targetDiv.querySelector('h3');
    targetDiv.insertBefore(evtP, h3);

    // 6) funções de fechar modal
    function closeModal() {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    }
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => e.target === overlay && closeModal());

    // 7) handler de submit
    form.addEventListener('submit', async ev => {
      ev.preventDefault();

      // coleta checkboxes marcados
      const aChecks = Array.from(form.querySelectorAll('input[name^="a_score"]:checked'));
      const bChecks = Array.from(form.querySelectorAll('input[name^="b_score"]:checked'));

      // atualiza stats das startups
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

      // soma dos deltas dos checkboxes
      const deltaA = aChecks.reduce((sum, c) => sum + Number(c.value), 0);
      const deltaB = bChecks.reduce((sum, c) => sum + Number(c.value), 0);

      // aplica deltas iniciais no backend e UI
      await patchPoints(a.empresa_id, deltaA);
      await patchPoints(b.empresa_id, deltaB);
      a.pts_totais += deltaA;
      b.pts_totais += deltaB;
      divBattle.querySelector('.pts-a').textContent = a.pts_totais;
      divBattle.querySelector('.pts-b').textContent = b.pts_totais;

      // aplica delta do market-event
      await patchPoints(target.empresa_id, evt.delta);
      target.pts_totais += evt.delta;
      divBattle.querySelector(
        target === a ? '.pts-a' : '.pts-b'
      ).textContent = target.pts_totais;
      // atualiza estatística de market-event
      if (evt.delta > 0) target.stats.bonusEvents = (target.stats.bonusEvents || 0) + 1;
      else target.stats.onusEvents = (target.stats.onusEvents || 0) + 1;

      // decide empate → Shark Fight
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
        divBattle.querySelector(
          sharkWinner === a ? '.pts-a' : '.pts-b'
        ).textContent = sharkWinner.pts_totais;
        const wDiv = divBattle.querySelector(
          sharkWinner === a
            ? `#companyA-${a.empresa_id}`
            : `#companyB-${b.empresa_id}`
        );
        wDiv.querySelector('h3').textContent += ' (decidido por Shark Fight!)';
        champ = sharkWinner;
      }

      // bônus de vencedor +30
      await patchPoints(champ.empresa_id, 30);
      champ.pts_totais += 30;
      divBattle.querySelector(
        champ === a ? '.pts-a' : '.pts-b'
      ).textContent = champ.pts_totais;

      // marca vencedor, bloqueia clique e guarda
      const selId = champ === a
        ? `#companyA-${a.empresa_id}`
        : `#companyB-${b.empresa_id}`;
      divBattle.querySelector(selId).classList.add('company-winner');
      divBattle.style.pointerEvents = 'none';
      winners.push(champ);

      closeModal();
      await carregarEmpresas();

      // habilita próxima rodada se necessário
      const totalBattles = Math.floor(participants.length / 2);
      if (winners.length === totalBattles) {
        document.querySelector('.next-round').disabled = false;
      }

      // se for final, mostra campeão
      if (participants.length === 2 && winners.length === 1) {
        tournamentChampion = winners[0];
        showWinner();
      }
    });
  });
}


// —————————————————————————————
// Campeão / Relatório / Excel / Reset
// —————————————————————————————
function showWinner() {
  const champ = tournamentChampion;
  document.querySelector('.body').innerHTML = `
    <h1 class="winner-header">VENCEDOR</h1>
    <div class="companyWinner">
      <h2 class="champ-name">${champ.nome}</h2>
      <p class="champ-slogan"><b>${champ.slogan}</b></p>
      <p>Pontuação Final: <b>${champ.pts_totais}</b></p>
    </div>
    <div class="btn__other">
      <button class="relatorio">Relatório de batalhas</button>
      <button class="excel">Gerar relatório EXCEL</button>
      <button class="again">Jogar novamente</button>
    </div>
  `;
  document.querySelector('.relatorio').addEventListener('click', showReport);
  document.querySelector('.excel').addEventListener('click', gerarExcel);
  document.querySelector('.again').addEventListener('click', resetDB);
}

function showReport() {
  const body = document.querySelector('.body');
  body.innerHTML = `
    <div class="report-div">
    <h1>Relatório de Batalhas</h1>
    <table class="report">
      <thead>
        <tr>
          <th>Rank</th><th>Startup</th><th>Pontos</th>
          <th>Pitches</th><th>Bugs</th><th>Trações</th>
          <th>Inv.Irritados</th><th>FakeNews</th>
          <th>SharkFights</th><th>Slogan</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    </div>
    <button class="back">Voltar</button>
  `;
  allStartups.sort((x, y) => y.pts_totais - x.pts_totais);
  const tbody = body.querySelector('tbody');
  allStartups.forEach((s, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${i + 1}</td><td>${s.nome}</td><td>${s.pts_totais}</td>
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

async function resetDB() {
  await Promise.all(allStartups.map(s =>
    fetch(`/empresas/${s.empresa_id}`, { method: 'DELETE' })
  ));
  window.location.reload();
}

function gerarExcel() {
  const headers = [
    'Rank', 'Startup', 'Pontos', 'Pitches', 'Bugs', 'Trações',
    'Inv.Irritados', 'FakeNews', 'SharkFights', 'Slogan'
  ];
  const sorted = [...allStartups].sort((a, b) => b.pts_totais - a.pts_totais);
  const rows = sorted.map((s, i) => [
    i + 1, s.nome, s.pts_totais,
    s.stats.convincing_pitch, s.stats.bugs,
    s.stats.good_user_traction, s.stats.angry_investor,
    s.stats.fake_news, s.stats.sharkFights,
    `"${s.slogan.replace(/"/g, '""')}"`
  ]);
  const sep = ';';
  const csv = [headers.join(sep), ...rows.map(r => r.join(sep))].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'relatorio.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ============================================
// DINO · FUKUI KINGS - App Logic
// ============================================

const STORAGE_KEY = 'dino_kings_v1';

function defaultData() {
  return {
    name: '',
    number: '',
    startDate: new Date().toISOString().split('T')[0],
    type: null,
    level: 1,
    stats: { shoot: 0, speed: 0, pass: 0, defense: 0, mental: 0 },
    records: [],
    selfPenta: null,
    crownsEarned: []
  };
}

function loadData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return Object.assign(defaultData(), JSON.parse(s));
  } catch(e) {}
  return defaultData();
}

function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
}

let data = loadData();

// ============================================
// レベル・進化
// ============================================
const LEVEL_THRESHOLDS = [0, 0, 5, 10, 30, 100];
const LEVEL_NAMES = ['', 'タマゴ', 'うまれたて', 'ジュニア', 'ヤング', 'KING'];
const TYPE_INFO = {
  tyrano:  { name: '🔥 ティラノ系（パワー）',     cls: 'type-tyrano',  jp: 'フクイティラノ系（パワータイプ）' },
  raptor:  { name: '⚡ ラプトル系（スピード）',  cls: 'type-raptor',  jp: 'フクイラプトル系（スピードタイプ）' },
  venator: { name: '💫 ベナートル系（テクニック）', cls: 'type-venator', jp: 'フクイベナートル系（テクニックタイプ）' }
};

const CROWN_TIERS = [
  { records: 5,    img: 'crown_1_basic.png',    name: '見習いの王冠' },
  { records: 15,   img: 'crown_2_small.png',    name: 'ブロンズ王冠' },
  { records: 30,   img: 'crown_3_medium.png',   name: 'シルバー王冠' },
  { records: 60,   img: 'crown_4_large.png',    name: 'ゴールド王冠' },
  { records: 100,  img: 'crown_5_red.png',      name: 'クラウンレッド' },
  { records: 200,  img: 'crown_6_emblem.png',   name: 'KINGエンブレム' },
  { records: 500,  img: 'crown_7_ultimate.png', name: '究極のキング' }
];

function getDinoImage() {
  const t = data.type || 'tyrano';
  const stages = ['', '01_egg', '02_hatch', '03_baby', '04_youth', '05_king'];
  return `dino_assets/${t}_${stages[data.level]}.png`;
}

function getCurrentCrown() {
  const n = data.records.length;
  let cur = null;
  for (const tier of CROWN_TIERS) {
    if (n >= tier.records) cur = tier;
    else break;
  }
  return cur;
}

function checkLevelUp() {
  let leveled = false;
  while (data.level < 5 && data.records.length >= LEVEL_THRESHOLDS[data.level + 1]) {
    data.level++;
    if (data.level === 3 && !data.type) data.type = judgeType();
    leveled = true;
  }
  
  // 王冠獲得チェック
  const cur = getCurrentCrown();
  if (cur && !data.crownsEarned.includes(cur.img)) {
    data.crownsEarned.push(cur.img);
    if (!leveled) {
      saveData();
      showCrownModal(cur);
      return true;
    }
  }
  
  if (leveled) {
    saveData();
    showEvolveModal();
    return true;
  }
  return false;
}

function judgeType() {
  const s = data.stats;
  const shootScore = s.shoot * 1.5 + s.mental * 0.5;
  const speedScore = s.speed * 1.5 + s.defense * 0.5;
  const balanceScore = s.pass * 2 + (s.shoot + s.speed + s.defense + s.mental) * 0.25;
  
  if (shootScore >= speedScore && shootScore >= balanceScore) return 'tyrano';
  if (speedScore >= balanceScore) return 'raptor';
  return 'venator';
}

function showEvolveModal() {
  document.getElementById('m-img').src = getDinoImage();
  let title = '🎉 レベルアップ！';
  let text = '';
  
  if (data.level === 2) {
    title = '🥚 たまごがかえった！';
    text = 'やったね！きみの恐竜がうまれたよ。\nもっと記録を続けてみよう。';
  } else if (data.level === 3) {
    title = '✨ タイプが判明した！';
    text = `きみの恐竜は\n${TYPE_INFO[data.type].jp}\nだったよ！\n\n自分の得意なプレイが絵に出てきたね。\nこれからも続けて、自分らしさを伸ばそう。`;
  } else if (data.level === 4) {
    title = '🦖 大きくなった！';
    text = 'もう立派なバスケ選手だ！\n試合でも活躍できるようになってきたね。';
  } else if (data.level === 5) {
    title = '👑 KING になった！';
    text = 'おめでとう！きみは Fukui Kings の本物のキングだ。\nNEVER GIVE UP！';
  }
  document.getElementById('m-title').textContent = title;
  document.getElementById('m-text').textContent = text;
  document.getElementById('modal').classList.add('show');
}

function showCrownModal(tier) {
  document.getElementById('m-img').src = 'dino_assets/' + tier.img;
  document.getElementById('m-title').textContent = '👑 王冠ゲット！';
  document.getElementById('m-text').textContent = `「${tier.name}」を手に入れた！\n${tier.records}回の記録を達成したご褒美だよ。\n設定画面でコレクションが見れるよ。`;
  document.getElementById('modal').classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
  // 連続レベルアップ・連続王冠を処理
  setTimeout(() => {
    if (checkLevelUp()) return; // モーダルが連鎖
    render();
  }, 100);
}

// ============================================
// 描画
// ============================================
function render() {
  document.getElementById('dino-img').src = getDinoImage();
  
  const lvl = data.level;
  const cur = LEVEL_THRESHOLDS[lvl];
  const next = lvl < 5 ? LEVEL_THRESHOLDS[lvl + 1] : LEVEL_THRESHOLDS[5];
  const inLvl = data.records.length - cur;
  const need = next - cur;
  
  document.getElementById('name-plate').textContent = LEVEL_NAMES[lvl];
  document.getElementById('level-label').textContent = `Lv.${lvl} ${LEVEL_NAMES[lvl]}`;
  document.getElementById('level-progress').textContent = lvl < 5 ? `${data.records.length} / ${next}` : 'MAX';
  document.getElementById('level-fill').style.width = lvl < 5 ? Math.min(100, inLvl/need*100) + '%' : '100%';
  
  const badge = document.getElementById('type-badge');
  if (data.type) {
    badge.textContent = TYPE_INFO[data.type].name;
    badge.className = 'type-badge ' + TYPE_INFO[data.type].cls;
  } else {
    badge.textContent = lvl >= 3 ? '?' : 'タイプ未判定';
    badge.className = 'type-badge type-unknown';
  }
  
  // 王冠オーバーレイは非表示（KING時の絵自体に王冠あるので不要）
  // 代わりに、ステージ右上に小さな王冠インジケーター
  const crown = getCurrentCrown();
  const crownEl = document.getElementById('crown-img');
  crownEl.style.display = 'none';
  
  const indEl = document.getElementById('crown-indicator');
  if (indEl) {
    if (crown) {
      indEl.innerHTML = `<img src="dino_assets/${crown.img}" style="width:28px;height:28px;image-rendering:pixelated;vertical-align:middle"><span style="font-size:10px;color:var(--gold);margin-left:3px;vertical-align:middle">×${data.records.length}</span>`;
      indEl.style.display = 'flex';
    } else {
      indEl.style.display = 'none';
    }
  }
  
  // ステータス
  const max = 250;
  ['shoot','speed','pass','defense','mental'].forEach(k => {
    const v = data.stats[k];
    document.getElementById(`b-${k}`).style.width = Math.min(100, v/max*100) + '%';
    document.getElementById(`n-${k}`).textContent = v;
  });
  
  renderHistory();
  
  // 設定
  document.getElementById('s-name').value = data.name;
  document.getElementById('s-number').value = data.number;
  document.getElementById('s-records').textContent = data.records.length;
  document.getElementById('s-start').textContent = data.startDate;
  document.getElementById('s-type').textContent = data.type ? TYPE_INFO[data.type].jp : '未判定';
  
  // 王冠コレクション
  const cc = document.getElementById('crown-collection');
  cc.innerHTML = CROWN_TIERS.map(t => {
    const got = data.crownsEarned.includes(t.img);
    return `<div style="background:${got?'rgba(255,200,58,.1)':'#222'};padding:8px 4px;border-radius:6px;text-align:center;border:1px solid ${got?'var(--gold)':'#333'};">
      <img src="dino_assets/${t.img}" style="width:48px;height:48px;image-rendering:pixelated;display:block;margin:0 auto;${got?'':'filter:grayscale(1) brightness(.4);'}">
      <div style="font-size:9px;color:${got?'var(--gold)':'var(--dim)'};margin-top:2px">${got ? t.name : t.records+'回'}</div>
    </div>`;
  }).join('');
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!data.records.length) {
    list.innerHTML = '<div class="empty">まだ記録がないよ。<br>練習や試合を記録してみよう！</div>';
    return;
  }
  const labels = { practice: '🏀 練習', game: '🏆 試合', scout: '🔍 偵察' };
  const recs = [...data.records].reverse().slice(0, 50);
  list.innerHTML = recs.map(r => {
    let detail = '';
    if (r.type === 'practice' && r.answers.mvp) detail = ` · MVP: ${mvpLabel(r.answers.mvp)}`;
    if (r.type === 'game' && r.answers.result) {
      const rl = { win: '勝ち', lose: '負け', draw: '引分' }[r.answers.result] || '';
      detail = ` · ${rl}${r.answers.score ? ' / '+r.answers.score+'点' : ''}`;
    }
    if (r.type === 'scout' && r.answers.team_name) detail = ` · vs ${r.answers.team_name}`;
    return `<div class="history-item"><span class="ty">${labels[r.type]||r.type}${detail}</span><span class="date">${r.date}</span></div>`;
  }).join('');
}

function mvpLabel(v) {
  return ({ shoot: 'シュート', speed: 'スピード', pass: 'パス', defense: 'ディフェンス', mental: '声出し' })[v] || v;
}

function goPage(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('p-'+p).classList.add('active');
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('nav-'+p);
  if (nb) nb.classList.add('active');
  if (p === 'penta') renderPenta();
  if (p === 'history') renderHistory();
}

// ============================================
// 記録フロー
// ============================================
let cur = null;

function startRecord(type) {
  cur = { type, date: new Date().toLocaleDateString('ja-JP'), timestamp: Date.now(), answers: {} };
  goPage('record');
  renderStep(0);
}

const STEPS_PRACTICE = [
  { type:'sel', key:'mood', q:'今日の調子は？', opts:[
    {v:'great',l:'😊 絶好調！'},{v:'ok',l:'🙂 まあまあ'},
    {v:'soso',l:'😐 微妙'},{v:'bad',l:'😣 ダメ'}
  ]},
  { type:'sel', key:'mvp', q:'今日いちばん がんばったプレイは？', cls:'three', opts:[
    {v:'shoot',l:'🎯 シュート'},{v:'speed',l:'⚡ スピード'},{v:'pass',l:'🤝 パス'},
    {v:'defense',l:'🛡 ディフェンス'},{v:'mental',l:'🔥 声出し'}
  ]},
  { type:'num', key:'count', q:'シュートをだいたい何本打った？\n（だいたいでOK、知らないなら0）', placeholder:'本数' },
  { type:'mini-sel', key:'discovery', q:'今日の発見はあった？\n（思いつかなかったら最後を選んでね）', cls:'three', opts:[
    {v:'form',l:'フォーム安定'},{v:'tired',l:'疲れると入らない'},{v:'angle',l:'角度が大事'},
    {v:'partner',l:'連携できた'},{v:'speed',l:'走りこめた'},{v:'skip',l:'思いつかない'}
  ]}
];

const STEPS_GAME = [
  { type:'sel', key:'result', q:'試合の結果は？', cls:'three', opts:[
    {v:'win',l:'🏆 勝ち'},{v:'lose',l:'💧 負け'},{v:'draw',l:'🤝 引分'}
  ]},
  { type:'sel', key:'mvp', q:'自分の今日のMVPプレイは？', cls:'three', opts:[
    {v:'shoot',l:'🎯 シュート'},{v:'speed',l:'⚡ スピード'},{v:'pass',l:'🤝 アシスト'},
    {v:'defense',l:'🛡 ディフェンス'},{v:'mental',l:'🔥 声出し'}
  ]},
  { type:'num', key:'score', q:'何点取った？\n（0でもいいよ）', placeholder:'得点' },
  { type:'mini-sel', key:'next', q:'次の試合で意識したいことは？', cls:'three', opts:[
    {v:'shoot',l:'🎯 シュートをもっと'},{v:'pass',l:'🤝 パスを工夫'},{v:'defense',l:'🛡 守備強化'},
    {v:'speed',l:'⚡ もっと走る'},{v:'mental',l:'🔥 声を出す'},{v:'team',l:'🤝 連携を強く'}
  ]}
];

const STEPS_SCOUT = [
  { type:'text', key:'team_name', q:'対戦相手のチーム名は？', placeholder:'例：○○ミニバス' },
  { type:'multi', key:'strength', q:'相手の強みは？\n（複数選べるよ）', cls:'three', opts:[
    {v:'fast',l:'⚡ 速い'},{v:'tall',l:'📏 高い'},{v:'skill',l:'✨ 上手い'},
    {v:'team',l:'🤝 連携'},{v:'tough',l:'💪 当たり強い'},{v:'shoot',l:'🎯 シュート'}
  ]},
  { type:'num', key:'top_player', q:'一番ヤバかった選手は何番？', placeholder:'背番号' },
  { type:'text', key:'top_player_note', q:'その選手のすごかったとこは？', placeholder:'例：3Pがめちゃ入る' },
  { type:'sel', key:'next_strategy', q:'次に当たるなら、どう攻める？', opts:[
    {v:'speed',l:'⚡ 走って勝つ'},{v:'defense',l:'🛡 守備で抑える'},
    {v:'pass',l:'🤝 連携でかわす'},{v:'shoot',l:'🎯 シュート力で勝つ'},
    {v:'mental',l:'🔥 気合で押す'},{v:'team',l:'👥 みんなで'}
  ]}
];

function renderStep(step) {
  const flow = document.getElementById('record-flow');
  const steps = cur.type === 'practice' ? STEPS_PRACTICE : 
                cur.type === 'game' ? STEPS_GAME : STEPS_SCOUT;
  
  if (step >= steps.length) { finishRecord(); return; }
  
  const s = steps[step];
  let speakerLabel = cur.type === 'scout' ? '偵察タイム！' : ((data.name||'きみ') + 'の恐竜');
  
  let html = `<div class="q-card">
    <div class="speaker"><img src="${getDinoImage()}"><span>${speakerLabel}</span></div>
    <div class="q">${s.q.replace(/\n/g,'<br>')}</div>`;
  
  if (s.type === 'sel' || s.type === 'mini-sel') {
    const cls = s.cls || '';
    html += `<div class="opts ${cls}">`;
    s.opts.forEach(o => {
      html += `<button class="opt ${s.type==='mini-sel'?'small':''}" onclick="answerSel('${s.key}','${o.v}',${step})">${o.l}</button>`;
    });
    html += `</div>`;
  } else if (s.type === 'multi') {
    const cls = s.cls || '';
    html += `<div class="opts ${cls}" id="multi-area">`;
    s.opts.forEach(o => {
      html += `<button class="opt small" data-v="${o.v}" onclick="toggleMulti(this)">${o.l}</button>`;
    });
    html += `</div><button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="answerMulti('${s.key}',${step})">次へ</button>`;
  } else if (s.type === 'num') {
    html += `<input type="number" class="input center" id="num-input" placeholder="${s.placeholder}" min="0" max="999" inputmode="numeric" pattern="[0-9]*">`;
    html += `<button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="answerNum('${s.key}',${step})">次へ</button>`;
    setTimeout(() => { const inp = document.getElementById('num-input'); if (inp) inp.focus(); }, 100);
  } else if (s.type === 'text') {
    html += `<textarea class="input" id="text-input" placeholder="${s.placeholder}"></textarea>`;
    html += `<button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="answerText('${s.key}',${step})">次へ</button>`;
  }
  
  html += `<div style="text-align:center;margin-top:10px;color:var(--dim);font-size:11px">${step+1} / ${steps.length}</div></div>`;
  
  // 戻るボタン
  html += `<div style="text-align:center;margin-top:8px"><button onclick="cancelRecord()" style="background:none;border:none;color:var(--dim);font-size:12px;text-decoration:underline">やめる</button></div>`;
  
  flow.innerHTML = html;
}

function answerSel(key, value, step) {
  cur.answers[key] = value;
  document.querySelectorAll('.opt').forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${value}'`) && b.getAttribute('onclick').includes(`'${key}'`)) {
      b.classList.add('sel');
    }
  });
  setTimeout(() => renderStep(step + 1), 200);
}

function answerNum(key, step) {
  const v = document.getElementById('num-input').value;
  cur.answers[key] = parseInt(v) || 0;
  renderStep(step + 1);
}

function answerText(key, step) {
  cur.answers[key] = document.getElementById('text-input').value;
  renderStep(step + 1);
}

function toggleMulti(btn) {
  btn.classList.toggle('sel');
}

function answerMulti(key, step) {
  const sel = [];
  document.querySelectorAll('#multi-area .opt.sel').forEach(b => sel.push(b.getAttribute('data-v')));
  cur.answers[key] = sel;
  renderStep(step + 1);
}

function cancelRecord() {
  if (confirm('記録をやめる？')) {
    cur = null;
    goPage('main');
  }
}

function finishRecord() {
  const a = cur.answers;
  
  // ステータスへの反映
  if (cur.type === 'practice') {
    if (a.mvp) data.stats[a.mvp] += 5;
    Object.keys(data.stats).forEach(k => data.stats[k] += 1);
    if (a.count) data.stats.shoot += Math.min(8, Math.floor(a.count / 10));
    if (a.discovery && a.discovery !== 'skip') data.stats.mental += 2;
  } else if (cur.type === 'game') {
    if (a.mvp) data.stats[a.mvp] += 8;
    Object.keys(data.stats).forEach(k => data.stats[k] += 2);
    if (a.score) data.stats.shoot += Math.min(20, a.score);
    if (a.result === 'win') data.stats.mental += 5;
  } else if (cur.type === 'scout') {
    data.stats.mental += 4;
    data.stats.pass += 4;
    if (a.next_strategy && data.stats[a.next_strategy] !== undefined) {
      data.stats[a.next_strategy] += 3;
    }
  }
  
  data.records.push(cur);
  saveData();
  
  if (!checkLevelUp()) {
    showCompletion();
  }
}

function startScout() {
  startRecord('scout');
}

function showCompletion() {
  const flow = document.getElementById('record-flow');
  flow.innerHTML = `<div class="q-card" style="text-align:center;padding:24px 16px">
    <img src="${getDinoImage()}" style="width:120px;height:120px;image-rendering:pixelated;display:block;margin:0 auto 10px">
    <h2 style="color:var(--gold);font-size:18px;margin-bottom:6px">記録完了！</h2>
    <p style="color:#ccc;font-size:13px;margin-bottom:14px">恐竜が成長したよ。<br>続けて記録すると、もっと育つよ。</p>
    <button class="btn btn-primary" style="width:100%" onclick="goPage('main')">メインへ</button>
  </div>`;
  render();
}

// ============================================
// ペンタグラフ
// ============================================
const PENTA_KEYS = ['shoot', 'speed', 'pass', 'defense', 'mental'];
const PENTA_LABELS = { shoot: '🎯シュート', speed: '⚡スピード', pass: '🤝パス', defense: '🛡守備', mental: '🔥メンタル' };

function renderPenta() {
  // SVG描画
  const svg = document.getElementById('penta-svg');
  const cx = 140, cy = 120, r = 90;
  const angles = [-Math.PI/2, -Math.PI/2 + 2*Math.PI/5, -Math.PI/2 + 4*Math.PI/5, -Math.PI/2 + 6*Math.PI/5, -Math.PI/2 + 8*Math.PI/5];
  
  let s = '';
  // グリッド（5層）
  for (let lv = 1; lv <= 5; lv++) {
    const rr = r * lv / 5;
    const pts = angles.map(a => `${cx + rr*Math.cos(a)},${cy + rr*Math.sin(a)}`).join(' ');
    s += `<polygon points="${pts}" fill="none" stroke="#333" stroke-width="1"/>`;
  }
  // 軸線
  angles.forEach(a => {
    s += `<line x1="${cx}" y1="${cy}" x2="${cx + r*Math.cos(a)}" y2="${cy + r*Math.sin(a)}" stroke="#333" stroke-width="1"/>`;
  });
  
  // データから算出した値（自動評価）
  const maxStat = Math.max(50, ...PENTA_KEYS.map(k => data.stats[k]));
  const dataPenta = PENTA_KEYS.map(k => Math.min(5, data.stats[k] / maxStat * 5));
  if (data.records.length > 0) {
    const ptsData = dataPenta.map((v, i) => {
      const rr = r * v / 5;
      return `${cx + rr*Math.cos(angles[i])},${cy + rr*Math.sin(angles[i])}`;
    }).join(' ');
    s += `<polygon points="${ptsData}" fill="rgba(136,187,255,0.2)" stroke="#88BBFF" stroke-width="2"/>`;
  }
  
  // 自己評価
  if (data.selfPenta) {
    const ptsSelf = PENTA_KEYS.map((k, i) => {
      const v = data.selfPenta[k] || 0;
      const rr = r * v / 5;
      return `${cx + rr*Math.cos(angles[i])},${cy + rr*Math.sin(angles[i])}`;
    }).join(' ');
    s += `<polygon points="${ptsSelf}" fill="rgba(255,200,58,0.25)" stroke="#FFC83A" stroke-width="2"/>`;
  }
  
  // ラベル
  PENTA_KEYS.forEach((k, i) => {
    const a = angles[i];
    const lr = r + 18;
    const lx = cx + lr*Math.cos(a);
    const ly = cy + lr*Math.sin(a);
    let anchor = 'middle';
    if (lx < cx - 5) anchor = 'end';
    else if (lx > cx + 5) anchor = 'start';
    s += `<text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" fill="#ccc" font-size="11">${PENTA_LABELS[k]}</text>`;
  });
  
  svg.innerHTML = s;
  
  // 自己評価入力
  const inp = document.getElementById('penta-input');
  inp.innerHTML = PENTA_KEYS.map(k => {
    const cur = data.selfPenta?.[k] ?? 3;
    return `<div class="slider-row">
      <label>${PENTA_LABELS[k]}<span class="v" id="pv-${k}">${cur}</span></label>
      <input type="range" min="1" max="5" step="1" value="${cur}" oninput="document.getElementById('pv-${k}').textContent=this.value" id="ps-${k}">
    </div>`;
  }).join('');
}

function saveSelfPenta() {
  data.selfPenta = {};
  PENTA_KEYS.forEach(k => {
    data.selfPenta[k] = parseInt(document.getElementById('ps-'+k).value);
  });
  saveData();
  renderPenta();
  alert('自己評価を保存したよ！\n記録から計算したペンタと比べてみよう。');
}

// ============================================
// 設定
// ============================================
function saveSettings() {
  data.name = document.getElementById('s-name').value;
  data.number = document.getElementById('s-number').value;
  saveData();
  alert('保存したよ！');
  render();
}

function resetData() {
  if (!confirm('本当に全部リセットしていい？\n記録もタイプも消えちゃうよ。')) return;
  if (!confirm('もう一度確認！\nすべてのデータが消えます。本当に？')) return;
  data = defaultData();
  saveData();
  render();
  goPage('main');
  alert('リセットしました。最初からはじめよう！');
}

// ============================================
// 起動
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  render();
});

const KEYS_URL = 'keys.json';
let data = null;

async function loadData() {
  const updatedEl = document.getElementById('updated');
  updatedEl.textContent = 'Загружаем данные...';

  try {
    const resp = await fetch(KEYS_URL + '?t=' + Date.now());
    if (!resp.ok) throw new Error('keys.json не найден');

    data = await resp.json();
    updatedEl.textContent = 'Обновлено: ' + formatTime(data.updated_at);

    switchMode('w_finland');        // по умолчанию Финляндия

  } catch (e) {
    console.error(e);
    updatedEl.textContent = 'Ошибка загрузки данных';
  }
}

function formatTime(utcStr) {
  if (!utcStr) return '—';
  try {
    const d = new Date(utcStr.replace(' ', 'T').replace(' UTC', 'Z'));
    const msk = new Date(d.getTime() + 3*60*60*1000);
    return msk.toISOString().slice(0,16).replace('T', ' ') + ' МСК';
  } catch(e) {
    return utcStr;
  }
}

function switchMode(mode) {
  // Подсветка активной вкладки
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('onclick').includes(mode));
  });

  const cardsEl = document.getElementById('cards');
  cardsEl.innerHTML = '';

  const countryKey = mode.startsWith('w_') ? mode.substring(2) : mode;
  const d = data[mode] || data[countryKey];

  if (!d || !d.best) {
    cardsEl.innerHTML = `<p style="text-align:center; padding:60px; color:#666;">Для выбранной страны пока нет рабочих ключей</p>`;
    return;
  }

  let html = `
    <div class="card">
      <h2>Лучший ключ — ${getLabel(mode)}</h2>
      <div class="key-box">${d.best}</div>
      <button class="copy-btn" onclick="copyText('${d.best.replace(/'/g,"\\'")}', this)">Копировать</button>
      <div class="stats">Рабочих: ${d.total_working || 0} из ${d.total || 0}</div>
  `;

  if (d.top10 && d.top10.length > 0) {
    html += `<h3 style="margin:28px 0 12px 4px; font-size:0.95rem; color:#ccc;">ТОП-10 быстрых серверов:</h3>`;

    html += d.top10.map((k, i) => `
      <div class="top5-item">
        <span class="host">${i+1}. ${k.host || 'Сервер'}:${k.port || ''}</span>
        <span class="latency">${k.latency_ms || '?'} мс</span>
        <button class="copy-small" onclick="copyText('${(k.key || '').replace(/'/g,"\\'")}', this)">копировать</button>
      </div>
    `).join('');
  }

  html += `</div>`;
  cardsEl.innerHTML = html;
}

function getLabel(mode) {
  const map = {
    'w_baltics': '🇱🇹🇪🇪🇱🇻 Прибалтика',
    'w_finland': '🇫🇮 Финляндия',
    'w_germany': '🇩🇪 Германия',
    'w_sweden': '🇸🇪 Швеция',
    'w_netherlands': '🇳🇱 Нидерланды',
    'w_poland': '🇵🇱 Польша',
    'w_other': '🌍 Остальные',
    'russia': '🇷🇺 Россия (Москва)'
  };
  return map[mode] || mode;
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Скопировано!';
    setTimeout(() => btn.textContent = original, 1600);
  });
}

// Загрузка при открытии страницы
window.onload = loadData;

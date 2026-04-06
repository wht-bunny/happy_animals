const KEYS_URL = 'keys.json';
let data = null;

async function loadData() {
  const updatedEl = document.getElementById('updated');
  if (updatedEl) updatedEl.textContent = 'Загружаем данные...';

  try {
    const resp = await fetch(KEYS_URL + '?t=' + Date.now());
    if (!resp.ok) throw new Error('keys.json не найден');

    data = await resp.json();

    const updatedEl2 = document.getElementById('updated');
    if (updatedEl2) updatedEl2.textContent = 'Обновлено: ' + formatTime(data.updated_at);

    // По умолчанию показываем Финляндию
    switchMode('w_finland');

  } catch (e) {
    console.error(e);
    const updatedEl3 = document.getElementById('updated');
    if (updatedEl3) updatedEl3.textContent = 'Ошибка загрузки данных';
  }
}

function formatTime(utcStr) {
  if (!utcStr) return '—';
  try {
    const d = new Date(utcStr.replace(' ', 'T').replace(' UTC', 'Z'));
    const msk = new Date(d.getTime() + 3 * 60 * 60 * 1000);
    return msk.toISOString().slice(0, 16).replace('T', ' ') + ' МСК';
  } catch (e) {
    return utcStr;
  }
}

function switchMode(mode) {
  // Подсвечиваем активную кнопку
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(mode));
  });

  const cardsEl = document.getElementById('cards');
  if (!cardsEl) return;

  cardsEl.innerHTML = '';

  const countryKey = mode.startsWith('w_') ? mode.substring(2) : mode;
  const d = data[mode] || data[countryKey];

  if (!d || !d.best) {
    cardsEl.innerHTML = `<p style="text-align:center; padding:50px; color:#888;">Для выбранной страны пока нет рабочих ключей</p>`;
    return;
  }

  let html = `
    <div class="card">
      <h2>Лучший ключ — ${getLabel(mode)}</h2>
      <div class="key-box">${d.best}</div>
      <button class="copy-btn" onclick="copyText('${d.best.replace(/'/g, "\\'")}', this)">Копировать</button>
      <div class="stats">Рабочих: ${d.total_working || 0} из ${d.total || 0}</div>
  `;

  if (d.top10 && d.top10.length > 0) {
    html += `<h3 style="margin: 25px 0 12px;">ТОП-10 быстрых серверов:</h3>`;
    html += d.top10.map((k, i) => `
      <div class="top-item">
        <span>${i+1}. ${k.host || 'Сервер'}:${k.port || ''}</span>
        <span class="ping">${k.latency_ms || '?'} мс</span>
        <button onclick="copyText('${(k.key || '').replace(/'/g, "\\'")}', this)">копировать</button>
      </div>
    `).join('');
  }

  html += `</div>`;
  cardsEl.innerHTML = html;
}

function getLabel(mode) {
  const labels = {
    'w_baltics': '🇱🇹🇪🇪🇱🇻 Прибалтика',
    'w_finland': '🇫🇮 Финляндия',
    'w_germany': '🇩🇪 Германия',
    'w_sweden': '🇸🇪 Швеция',
    'w_netherlands': '🇳🇱 Нидерланды',
    'w_poland': '🇵🇱 Польша',
    'w_other': '🌍 Остальные',
    'russia': '🇷🇺 Россия (Москва)'
  };
  return labels[mode] || mode;
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Скопировано!';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });
}

// Автозагрузка при открытии страницы
window.onload = loadData;

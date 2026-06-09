/* ============================================================
   app.js — 상상마루 대관 홈페이지
   데이터: data/spaces.json, data/site.json
============================================================ */

/* ── 전역 상태 ── */
let SPACES  = [];
let SITE    = {};
let ACCOUNT = {};
let currentDiscountRate = 0;
let occupiedSlots       = [];
let _timeSlots          = [];   // site.json 시간 슬롯 캐시

/* ── 아이콘 SVG 맵 ── */
const ICONS = {
  grid: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>`,
  edit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>`,
  card: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
  </svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>
  </svg>`,
  arrow: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M3 8h10M9 4l4 4-4 4"/>
  </svg>`,
  pin: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>`
};

/* ── 유틸 ── */
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('ko-KR');

/* XSS 방지 — DOM 삽입 전 모든 사용자 입력값 이스케이프 */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/* ── 입력 검증 규칙 ── */
const RULES = {
  name:      { maxLen: 30,  pattern: /^[가-힣a-zA-Z\s]{1,30}$/,            msg: '성명은 한글 또는 영문 1~30자로 입력해 주세요.' },
  phone:     { maxLen: 20,  pattern: /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/, msg: '올바른 휴대폰 번호를 입력해 주세요. (예: 010-1234-5678)' },
  email:     { maxLen: 100, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,          msg: '올바른 이메일 주소를 입력해 주세요.' },
  org:       { maxLen: 60,  pattern: null,                                   msg: '' },
  depositor: { maxLen: 30,  pattern: /^[가-힣a-zA-Z\s]{0,30}$/,            msg: '입금자명은 한글 또는 영문 30자 이내로 입력해 주세요.' },
  count:     { min: 1, max: 500 },
  purpose:   { maxLen: 300, pattern: null,                                   msg: '' },
};

function validateField(id, rule) {
  const el  = $(id);
  if (!el) return true;
  const val = el.value.trim();

  if (rule.pattern && val !== '') {
    if (!rule.pattern.test(val)) return rule.msg;
  }
  if (rule.maxLen && val.length > rule.maxLen) {
    return `${rule.maxLen}자 이내로 입력해 주세요.`;
  }
  return null; // 통과
}

function showFieldError(id, msg) {
  clearFieldError(id);
  const el = $(id);
  if (!el) return;
  el.classList.add('field-error');
  const errEl = document.createElement('div');
  errEl.className = 'field-error-msg';
  errEl.id = id + '_err';
  errEl.textContent = msg;
  el.parentNode.appendChild(errEl);
}

function clearFieldError(id) {
  const el  = $(id);
  const err = $(id + '_err');
  if (el)  el.classList.remove('field-error');
  if (err) err.remove();
}

function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  document.querySelectorAll('.field-error-msg').forEach(el => el.remove());
}

/* ============================================================
   데이터 로드
============================================================ */
async function loadData() {
  const [spacesRes, siteRes] = await Promise.all([
    fetch('data/spaces.json'),
    fetch('data/site.json'),
  ]);
  const spacesData = await spacesRes.json();
  const siteData   = await siteRes.json();

  SPACES      = spacesData.spaces;
  SITE        = siteData.site;
  ACCOUNT     = siteData.account;
  _timeSlots  = siteData.timeSlots;
  window._bookingWindow = siteData.bookingWindow;

  applyMeta(siteData);
  renderAll(spacesData, siteData);
}

/* ── 메타 ── */
function applyMeta(data) {
  const { site, nav, footer } = data;
  document.title = `${site.name} | 공간 대관`;

  const logoText = site.name.replace(
    site.nameHighlight, `<span>${site.nameHighlight}</span>`
  );
  document.querySelectorAll('.nav-logo').forEach(el => el.innerHTML = logoText);
  document.querySelectorAll('.footer-logo').forEach(el => el.innerHTML = logoText);

  const heroTag = document.querySelector('.hero-tag');
  if (heroTag) heroTag.textContent = site.subtitle;

  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    heroTitle.innerHTML = site.heroTitle.split('\n').map(line =>
      line === site.heroTitleHighlight ? `<em>${line}</em>` : line
    ).join('<br>');
  }

  const heroDesc = document.querySelector('.hero-desc');
  if (heroDesc) heroDesc.innerHTML = site.heroDesc.replace('\n', '<br>');

  const footerInfo = document.querySelector('.footer-info');
  if (footerInfo) footerInfo.innerHTML =
    `${esc(site.address)}<br>대관 문의 : ${esc(site.phone)} &nbsp;|&nbsp; ${esc(site.officeHours)}`;

  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.innerHTML = nav.map(n =>
      `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`
    ).join('') +
    `<li class="nav-cta"><a href="#" id="navApplyBtn">대관 신청</a></li>`;
    $('navApplyBtn')?.addEventListener('click', e => { e.preventDefault(); openApply(null); });
  }

  const footerLinks = document.querySelector('.footer-links');
  if (footerLinks) footerLinks.innerHTML = data.footer.map(f =>
    `<li><a href="${esc(f.href)}">${esc(f.label)}</a></li>`
  ).join('');

  const statsEl = $('heroStats');
  if (statsEl) statsEl.innerHTML = data.stats.map(s => `
    <div class="hero-stat-card">
      <div class="hero-stat-num">${esc(s.num)}</div>
      <div class="hero-stat-label">${esc(s.label)}</div>
    </div>
  `).join('');

  document.querySelectorAll('.btn-tel').forEach(el => {
    el.href = `tel:${site.phone}`;
    el.textContent = '전화 문의';
  });
}

/* ── 전체 렌더 ── */
function renderAll(spacesData, siteData) {
  renderFilters(spacesData.filters);
  renderCards('all');
  renderProcess(siteData.process);
  renderDiscounts(siteData.discounts);
  renderRules(siteData.rules);
  renderApplySpaceSelect();
  renderTimeSlots(siteData.timeSlots, []);
  renderDurationOptions(siteData.durationOptions);
  renderDiscountCheckboxes(siteData.discounts);
  observeFadeUp();
}

/* ── 필터 탭 ── */
function renderFilters(filters) {
  const el = document.querySelector('.filter-tabs');
  if (!el) return;
  el.innerHTML = filters.map((f, i) => `
    <button class="filter-btn${i === 0 ? ' active' : ''}" data-filter="${esc(f.key)}">${esc(f.label)}</button>
  `).join('');
  el.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    el.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCards(btn.dataset.filter);
  });
}

/* ── 공간 카드 ── */
function renderCards(filter = 'all') {
  const grid = $('spaceGrid');
  if (!grid) return;
  const list = filter === 'all' ? SPACES : SPACES.filter(s => s.type === filter);

  grid.innerHTML = list.map(s => {
    const cap = s.maxCapacity || s.capacity;
    return `
      <div class="space-card fade-up" data-id="${esc(s.id)}" role="button" tabindex="0">
        <div class="card-thumb">
          ${buildThumb(s)}
          <span class="card-floor-badge">${esc(s.floor)}</span>
          <span class="card-type-badge">${esc(s.typeLabel)}</span>
        </div>
        <div class="card-body">
          <div class="card-name">${esc(s.name)}</div>
          <div class="card-capacity">최대 <strong>${cap}명</strong> 수용</div>
          <div class="card-meta">
            <div class="card-meta-item">
              <span class="meta-label">기본 시간</span>
              <span class="meta-value">${s.minHours}시간</span>
            </div>
            <div class="card-meta-item">
              <span class="meta-label">시간당 요금</span>
              <span class="meta-value">${fmt(s.pricePerHour)}원</span>
            </div>
            <div class="card-meta-item">
              <span class="meta-label">기본 요금</span>
              <span class="meta-value">${fmt(s.pricePerHour * s.minHours)}원</span>
            </div>
            <button class="card-cta">신청하기</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.addEventListener('click', e => {
    const card = e.target.closest('.space-card');
    if (!card) return;
    openModal(card.dataset.id);
  });
  observeFadeUp();
}

function buildThumb(s) {
  if (s.image) return `
    <img src="${esc(s.image)}" alt="${esc(s.name)}" class="card-thumb-img"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" loading="lazy">
    <div class="card-thumb-fallback" style="display:none;">${esc(s.imageFallback)}</div>`;
  return `<div class="card-thumb-fallback">${esc(s.imageFallback)}</div>`;
}

function renderProcess(steps) {
  const el = document.querySelector('.steps');
  if (!el) return;
  el.innerHTML = steps.map(s => `
    <div class="step">
      <div class="step-accent-line"></div>
      <div class="step-icon">${ICONS[s.icon] || ''}</div>
      <div class="step-num">${esc(s.num)}</div>
      <div class="step-title">${esc(s.title)}</div>
      <div class="step-desc">${esc(s.desc)}</div>
    </div>
  `).join('');
}

function renderDiscounts(discounts) {
  const el = document.querySelector('.discount-grid');
  if (!el) return;
  el.innerHTML = discounts.map(d => `
    <div class="discount-item fade-up">
      <div class="discount-rate">${esc(d.rate)}<small>${esc(d.unit)}</small></div>
      <div>
        <div class="discount-info-title">${esc(d.title)}</div>
        <div class="discount-info-desc">${esc(d.desc)}</div>
      </div>
    </div>
  `).join('');
}

function renderRules(rules) {
  const el = document.querySelector('.rules-grid');
  if (!el) return;
  el.innerHTML = rules.map(r => `
    <div class="rules-card fade-up">
      <div class="rules-card-title">${esc(r.title)}</div>
      <ul class="rules-list">
        ${r.items.map(item => `<li>${esc(item)}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

function renderApplySpaceSelect() {
  const sel = $('fSpace');
  if (!sel) return;
  sel.innerHTML = '<option value="">공간을 선택해 주세요</option>' +
    SPACES.map(s =>
      `<option value="${esc(s.id)}">${esc(s.name)} (${esc(s.floor)})</option>`
    ).join('');
}

/* ── 시간 슬롯 (occupied → disabled) ── */
function renderTimeSlots(slots, occupied = []) {
  const sel = $('fTime');
  if (!sel) return;
  sel.innerHTML = '<option value="">시간 선택</option>' +
    slots.map(t => {
      const h = parseInt(t);
      const isOccupied = occupied.some(oc => {
        const s = parseInt(oc.start);
        const e = parseInt(oc.end);
        return h >= s && h < e;
      });
      return `<option value="${esc(t)}"${isOccupied ? ' disabled' : ''}>
        ${esc(t)}${isOccupied ? ' (예약됨)' : ''}
      </option>`;
    }).join('');
}

function renderDurationOptions(opts) {
  const sel = $('fDuration');
  if (!sel) return;
  sel.innerHTML = opts.map(h =>
    `<option value="${h}"${h === 3 ? ' selected' : ''}>${h}시간</option>`
  ).join('');
}

function renderDiscountCheckboxes(discounts) {
  const el = $('discountCheckboxes');
  if (!el) return;
  el.innerHTML = discounts.map(d => `
    <label class="checkbox-item">
      <input type="checkbox" name="discount" value="${Number(d.value)}">
      <span>${esc(d.title)} (${esc(d.rate)} ${esc(d.unit)})</span>
    </label>
  `).join('');
  el.addEventListener('change', e => {
    const cb = e.target;
    if (!cb.matches('input[type="checkbox"]')) return;
    handleDiscount(cb);
  });
}

/* ============================================================
   캘린더 슬롯 조회
============================================================ */
async function fetchAvailableSlots(spaceName, date) {
  const url = SITE.appsScriptUrl;
  if (!url || !spaceName || !date) return null;

  setSlotLoading(true);
  try {
    const res = await fetch(
      `${url}?action=getAvailableSlots` +
      `&spaceName=${encodeURIComponent(spaceName)}` +
      `&date=${encodeURIComponent(date)}`
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch(e) {
    console.warn('슬롯 조회 실패:', e);
    return null;
  } finally {
    setSlotLoading(false);
  }
}

function setSlotLoading(loading) {
  const sel  = $('fTime');
  const btn  = $('slotFetchBtn');
  if (!sel) return;
  if (loading) {
    sel.innerHTML = '<option value="">조회 중…</option>';
    sel.disabled = true;
    if (btn) { btn.disabled = true; btn.textContent = '조회 중…'; }
  } else {
    sel.disabled = false;
    if (btn) { btn.disabled = false; btn.textContent = '시간 확인'; }
  }
}

async function onSpaceOrDateChange() {
  const spaceId = $('fSpace')?.value;
  const date    = $('fDate')?.value;

  if (!spaceId || !date) {
    occupiedSlots = [];
    renderTimeSlots(_timeSlots, []);
    setSlotStatus('공간과 날짜를 모두 선택하면 가능한 시간을 표시합니다.', 'idle');
    lockStep2(true);
    return;
  }

  const space  = SPACES.find(s => s.id === spaceId);
  if (!space) return;

  const result = await fetchAvailableSlots(space.name, date);

  if (result && result.ok) {
    occupiedSlots = result.occupied || [];
    renderTimeSlots(_timeSlots, occupiedSlots);
    const avail = result.available?.length || 0;
    const occ   = result.occupied?.length  || 0;
    if (avail === 0) {
      setSlotStatus(`${date} ${space.name}은 예약이 꽉 찼습니다. 다른 날짜를 선택해 주세요.`, 'full');
      lockStep2(true);
    } else {
      setSlotStatus(`${avail}개 시간대 신청 가능 (${occ > 0 ? occ + '개 예약됨' : '전체 가능'})`, 'ok');
      lockStep2(false);
    }
  } else {
    occupiedSlots = [];
    renderTimeSlots(_timeSlots, []);
    setSlotStatus('시간 조회를 건너뜁니다. 시간 선택 후 신청 시 재확인됩니다.', 'warn');
    lockStep2(false); // 조회 실패 시 사용자가 진행할 수 있도록 허용
  }

  clearFieldError('fTime');
  updatePrice();
}

function setSlotStatus(msg, type) {
  const el = $('slotStatus');
  if (!el) return;
  el.textContent = msg;
  el.dataset.type = type; // CSS로 색상 구분
}

/* step2 (신청자 정보 영역) 잠금 제어 */
function lockStep2(locked) {
  const step2 = $('step2Fields');
  if (!step2) return;
  step2.style.opacity  = locked ? '0.35' : '1';
  step2.style.pointerEvents = locked ? 'none' : '';
  const btn = document.querySelector('#formState .btn-primary');
  if (btn) btn.disabled = locked;
}

/* ============================================================
   모달 — 공간 상세
============================================================ */
function openModal(id) {
  const s = SPACES.find(x => x.id === id);
  if (!s) return;

  $('modalThumbWrap').innerHTML = buildThumb(s);
  $('modalTag').textContent  = `${s.floor} · ${s.typeLabel}`;
  $('modalName').textContent = s.name;
  $('modalDesc').textContent = s.desc;

  $('modalSpecs').innerHTML = `
    <div class="spec-item">
      <div class="spec-label">수용 인원</div>
      <div class="spec-value"><em>${s.maxCapacity || s.capacity}</em>명</div>
    </div>
    <div class="spec-item">
      <div class="spec-label">기본 요금</div>
      <div class="spec-value"><em>${fmt(s.pricePerHour * s.minHours)}</em>원</div>
    </div>
    <div class="spec-item">
      <div class="spec-label">최소 이용</div>
      <div class="spec-value"><em>${s.minHours}</em>시간</div>
    </div>
  `;

  if (s.features?.length) {
    $('modalFeatures').innerHTML = s.features.map(f =>
      `<span class="feature-tag">${esc(f)}</span>`).join('');
    $('modalFeatures').style.display = 'flex';
  } else {
    $('modalFeatures').style.display = 'none';
  }

  $('modalApplyBtn').onclick = () => { closeModal(); openApply(s.id); };
  $('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== $('modalOverlay')) return;
  $('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================================
   신청 모달 — 2단계 UX
   Step1: 공간·날짜·시간 선택 (슬롯 확인)
   Step2: 신청자 정보 + 신청 내용 입력
============================================================ */
function openApply(spaceId) {
  clearAllErrors();

  /* 공간 사전 선택 */
  if (spaceId) {
    $('fSpace').value = spaceId;
    const s = SPACES.find(x => x.id === spaceId);
    $('selectedSpaceBadge').style.display = 'inline-flex';
    $('selectedSpaceName').textContent = esc(s.name);
  } else {
    $('fSpace').value = '';
    $('selectedSpaceBadge').style.display = 'none';
  }

  /* 날짜 범위 설정 */
  const { minDaysAhead = 7, maxDaysAhead = 30 } = window._bookingWindow || {};
  const today = new Date();
  const min = new Date(today); min.setDate(today.getDate() + minDaysAhead);
  const max = new Date(today); max.setDate(today.getDate() + maxDaysAhead);
  $('fDate').min   = min.toISOString().split('T')[0];
  $('fDate').max   = max.toISOString().split('T')[0];
  $('fDate').value = '';

  /* 폼 초기화 */
  $('formState').style.display    = 'block';
  $('successState').style.display = 'none';
  currentDiscountRate = 0;
  occupiedSlots = [];
  document.querySelectorAll('#discountCheckboxes input[type="checkbox"]')
    .forEach(c => c.checked = false);
  document.querySelectorAll('#step2Fields input, #step2Fields textarea')
    .forEach(el => { el.value = ''; });

  /* Step2 잠금 — 슬롯 확인 전까지 신청 불가 */
  lockStep2(true);
  setSlotStatus('공간과 날짜를 선택하면 가능한 시간을 표시합니다.', 'idle');
  renderTimeSlots(_timeSlots, []);
  updatePrice();

  $('applyOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  /* 공간이 이미 선택된 경우 날짜만 선택하면 바로 조회되도록 포커스 */
  if (spaceId) setTimeout(() => $('fDate')?.focus(), 300);
}

function closeApply() {
  $('applyOverlay').classList.remove('open');
  document.body.style.overflow = '';
  clearAllErrors();
}

/* ── 감면 ── */
function handleDiscount(cb) {
  document.querySelectorAll('#discountCheckboxes input[type="checkbox"]')
    .forEach(c => { if (c !== cb) c.checked = false; });
  currentDiscountRate = cb.checked ? parseInt(cb.value) : 0;
  updatePrice();
}

/* ── 요금 계산 ── */
function updatePrice() {
  const spaceId  = $('fSpace')?.value;
  const duration = parseInt($('fDuration')?.value) || 1;
  const priceEl  = $('priceDisplay');
  const noteEl   = $('priceNote');
  if (!priceEl) return;

  if (!spaceId) {
    priceEl.textContent = '—';
    if (noteEl) noteEl.textContent = '';
    return;
  }

  const s     = SPACES.find(x => x.id === spaceId);
  const base  = s.pricePerHour * duration;
  const final = currentDiscountRate === 100 ? 0
    : Math.round(base * (1 - currentDiscountRate / 100));

  priceEl.textContent = final === 0 ? '무료' : `${fmt(final)}원`;
  if (noteEl) noteEl.textContent = currentDiscountRate > 0
    ? `(${fmt(base)}원 → ${currentDiscountRate}% 감면)`
    : `(${duration}시간 기준)`;
}

/* ============================================================
   신청 제출 — 클라이언트 검증 → 서버 전송 → 완료
============================================================ */
async function submitApply() {
  clearAllErrors();

  /* ── 1단계: 예약 정보 검증 ── */
  const spaceId = $('fSpace')?.value;
  const date    = $('fDate')?.value;
  const time    = $('fTime')?.value;
  const duration = parseInt($('fDuration')?.value) || 0;

  let hasError = false;

  if (!spaceId) {
    showFieldError('fSpace', '공간을 선택해 주세요.');
    hasError = true;
  }
  if (!date) {
    showFieldError('fDate', '날짜를 선택해 주세요.');
    hasError = true;
  }
  if (!time) {
    showFieldError('fTime', '시작 시간을 선택해 주세요.');
    hasError = true;
  }
  if (!duration || duration < 1) {
    showFieldError('fDuration', '사용 시간을 선택해 주세요.');
    hasError = true;
  }

  /* ── 2단계: 신청자 정보 검증 ── */
  const name  = $('fName')?.value.trim();
  const phone = $('fPhone')?.value.trim();
  const email = $('fEmail')?.value.trim();
  const org   = $('fOrg')?.value.trim();
  const depositor = $('fDepositor')?.value.trim();
  const countVal  = parseInt($('fCount')?.value);
  const purpose   = $('fPurpose')?.value.trim();

  if (!name) {
    showFieldError('fName', '성명을 입력해 주세요.');
    hasError = true;
  } else {
    const err = validateField('fName', RULES.name);
    if (err) { showFieldError('fName', err); hasError = true; }
  }

  if (!phone) {
    showFieldError('fPhone', '연락처를 입력해 주세요.');
    hasError = true;
  } else {
    const err = validateField('fPhone', RULES.phone);
    if (err) { showFieldError('fPhone', err); hasError = true; }
  }

  if (!email) {
    showFieldError('fEmail', '이메일을 입력해 주세요.');
    hasError = true;
  } else {
    const err = validateField('fEmail', RULES.email);
    if (err) { showFieldError('fEmail', err); hasError = true; }
  }

  if (org) {
    const err = validateField('fOrg', RULES.org);
    if (err) { showFieldError('fOrg', err); hasError = true; }
  }

  if (depositor) {
    const err = validateField('fDepositor', RULES.depositor);
    if (err) { showFieldError('fDepositor', err); hasError = true; }
  }

  if (!countVal || countVal < 1 || countVal > 500) {
    showFieldError('fCount', '예상 인원을 1~500 사이로 입력해 주세요.');
    hasError = true;
  }

  if (!purpose) {
    showFieldError('fPurpose', '사용 목적을 입력해 주세요.');
    hasError = true;
  } else if (purpose.length > 300) {
    showFieldError('fPurpose', '300자 이내로 입력해 주세요.');
    hasError = true;
  }

  if (hasError) {
    /* 첫 번째 오류 필드로 스크롤 */
    document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  /* ── 3단계: 서버 전송 ── */
  const s     = SPACES.find(x => x.id === spaceId);
  const base  = s.pricePerHour * duration;
  const final = currentDiscountRate === 100 ? 0
    : Math.round(base * (1 - currentDiscountRate / 100));

  const submitBtn = document.querySelector('#formState .btn-primary');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '신청 처리 중…'; }

  if (!SITE.appsScriptUrl) {
    /* 개발 환경: URL 미설정 시 완료 화면 바로 표시 (테스트용) */
    console.warn('[개발모드] appsScriptUrl 미설정 — 완료 화면만 표시합니다.');
    showSuccess({ name, depositor, final });
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '신청 완료하기'; }
    return;
  }

  try {
    const res = await fetch(SITE.appsScriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        name, phone, email, org,
        depositor: depositor || name,
        spaceId,
        spaceName:     s.name,
        date, time, duration,
        count:         countVal,
        purpose,
        discountRate:  currentDiscountRate,
        discountLabel: $('discountCheckboxes')?.querySelector('input:checked')
          ?.closest('label')?.querySelector('span')?.textContent?.trim() || '',
        basePrice:  base,
        finalPrice: final,
      }),
    });

    if (!res.ok) throw new Error('서버 응답 오류 (HTTP ' + res.status + ')');

    const result = await res.json();

    if (!result.ok) {
      const errMsg = result.error || '신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      showFormError(errMsg);
      if (result.code === 'SLOT_OCCUPIED') {
        await onSpaceOrDateChange(); // 시간 목록 갱신
      }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '신청 완료하기'; }
      return;
    }

    /* 서버 정상 응답 시에만 완료 화면 */
    showSuccess({ name, depositor, final });

  } catch(err) {
    /* 네트워크 오류 등 — 완료 처리하지 않고 오류 안내 */
    console.error('신청 전송 실패:', err);
    showFormError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '신청 완료하기'; }
  }
}

function showSuccess({ name, depositor, final }) {
  const depositorName = depositor || name;
  const finalStr      = final === 0 ? '무료' : `${fmt(final)}원`;

  /* textContent 사용 — XSS 방지 */
  $('successAmountBox').textContent      = finalStr;
  $('successAmountInline').textContent   = finalStr;
  $('successDepositorName').textContent  = depositorName;
  $('successBankName').textContent       = ACCOUNT.bank;
  $('successAccountNum').textContent     = ACCOUNT.number;
  $('successAccountHolder').textContent  = ACCOUNT.holder;
  $('successDeadline').textContent       = ACCOUNT.deadline;

  $('formState').style.display    = 'none';
  $('successState').style.display = 'block';
}

function showFormError(msg) {
  let errEl = $('formErrorMsg');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.id = 'formErrorMsg';
    errEl.className = 'form-error-banner';
    const btn = document.querySelector('#formState .btn-primary');
    btn?.parentNode.insertBefore(errEl, btn);
  }
  errEl.textContent = msg;
  errEl.style.display = 'block';
  errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { if (errEl) errEl.style.display = 'none'; }, 6000);
}

/* ============================================================
   Intersection Observer
============================================================ */
function observeFadeUp() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up:not(.visible)').forEach(el => io.observe(el));
}

/* ============================================================
   초기화
============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  /* 공간 + 날짜 변경 → 슬롯 조회 트리거 */
  $('fSpace')?.addEventListener('change', () => {
    onSpaceOrDateChange();
    updatePrice();
  });
  $('fDate')?.addEventListener('change', onSpaceOrDateChange);
  $('fDuration')?.addEventListener('change', updatePrice);

  /* 입력 중 오류 메시지 즉시 제거 */
  ['fName','fPhone','fEmail','fOrg','fDepositor','fCount','fPurpose'].forEach(id => {
    $(id)?.addEventListener('input', () => clearFieldError(id));
  });

  $('modalOverlay')?.addEventListener('click', closeModal);
  $('applyOverlay')?.addEventListener('click', e => {
    if (e.target === $('applyOverlay')) closeApply();
  });

  document.querySelector('.hero-cta')?.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('#spaces')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.querySelector('.cta-apply-btn')?.addEventListener('click', () => openApply(null));

  window.openApply   = openApply;
  window.closeApply  = closeApply;
  window.closeModal  = closeModal;
  window.submitApply = submitApply;
});
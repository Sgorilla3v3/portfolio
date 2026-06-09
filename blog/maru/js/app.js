/* ============================================================
   app.js — 상상마루 대관 홈페이지
   데이터는 data/spaces.json, data/site.json 에서 fetch
============================================================ */

/* ── 전역 상태 ─────────────────────────────────────────── */
let SPACES  = [];
let SITE    = {};
let ACCOUNT = {};
let currentDiscountRate = 0;

/* ── 아이콘 SVG 맵 ─────────────────────────────────────── */
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

/* ── 유틸 ───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('ko-KR');

function setHTML(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html;
}

/* ── 데이터 로드 ────────────────────────────────────────── */
async function loadData() {
  const [spacesRes, siteRes] = await Promise.all([
    fetch('data/spaces.json'),
    fetch('data/site.json')
  ]);
  const spacesData = await spacesRes.json();
  const siteData   = await siteRes.json();

  SPACES  = spacesData.spaces;
  SITE    = siteData.site;
  ACCOUNT = siteData.account;

  applyMeta(siteData);
  renderAll(spacesData, siteData);
}

/* ── 메타 / 전역 텍스트 적용 ────────────────────────────── */
function applyMeta(data) {
  const { site, nav, footer } = data;

  document.title = `${site.name} | 공간 대관`;

  /* 로고 */
  const logoText = site.name.replace(
    site.nameHighlight,
    `<span>${site.nameHighlight}</span>`
  );
  document.querySelectorAll('.nav-logo').forEach(el => el.innerHTML = logoText);
  document.querySelectorAll('.footer-logo').forEach(el => el.innerHTML = logoText);

  /* hero */
  const heroTag = document.querySelector('.hero-tag');
  if (heroTag) heroTag.textContent = site.subtitle;

  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const lines = site.heroTitle.split('\n').map(line =>
      line === site.heroTitleHighlight
        ? `<em>${line}</em>`
        : line
    ).join('<br>');
    heroTitle.innerHTML = lines;
  }

  const heroDesc = document.querySelector('.hero-desc');
  if (heroDesc) heroDesc.innerHTML = site.heroDesc.replace('\n', '<br>');

  /* 푸터 */
  const footerInfo = document.querySelector('.footer-info');
  if (footerInfo) {
    footerInfo.innerHTML = `
      ${site.address}<br>
      대관 문의 : ${site.phone} &nbsp;|&nbsp; ${site.officeHours}
    `;
  }

  /* nav 링크 */
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.innerHTML = nav.map(n =>
      `<li><a href="${n.href}">${n.label}</a></li>`
    ).join('') +
    `<li class="nav-cta"><a href="#" id="navApplyBtn">대관 신청</a></li>`;
    $('navApplyBtn')?.addEventListener('click', e => { e.preventDefault(); openApply(null); });
  }

  /* footer 링크 */
  const footerLinks = document.querySelector('.footer-links');
  if (footerLinks) {
    footerLinks.innerHTML = data.footer.map(f =>
      `<li><a href="${f.href}">${f.label}</a></li>`
    ).join('');
  }

  /* hero stats — hero-stat-card 그리드 */
  const statsEl = document.getElementById('heroStats');
  if (statsEl) {
    statsEl.innerHTML = data.stats.map(s => `
      <div class="hero-stat-card">
        <div class="hero-stat-num">${s.num}</div>
        <div class="hero-stat-label">${s.label}</div>
      </div>
    `).join('');
  }

  /* CTA 전화버튼 */
  document.querySelectorAll('.btn-tel').forEach(el => {
    el.href = `tel:${site.phone}`;
    el.textContent = '전화 문의';
  });
}

/* ── 전체 렌더 ──────────────────────────────────────────── */
function renderAll(spacesData, siteData) {
  renderFilters(spacesData.filters);
  renderCards('all');
  renderProcess(siteData.process);
  renderDiscounts(siteData.discounts);
  renderRules(siteData.rules);
  renderApplySpaceSelect();
  renderTimeSlots(siteData.timeSlots);
  renderDurationOptions(siteData.durationOptions);
  renderDiscountCheckboxes(siteData.discounts);
  observeFadeUp();
}

/* ── 필터 탭 ────────────────────────────────────────────── */
function renderFilters(filters) {
  const el = document.querySelector('.filter-tabs');
  if (!el) return;
  el.innerHTML = filters.map((f, i) => `
    <button class="filter-btn${i === 0 ? ' active' : ''}"
      data-filter="${f.key}">${f.label}</button>
  `).join('');
  el.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    el.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCards(btn.dataset.filter);
  });
}

/* ── 공간 카드 ──────────────────────────────────────────── */
function renderCards(filter = 'all') {
  const grid = $('spaceGrid');
  if (!grid) return;
  const list = filter === 'all' ? SPACES : SPACES.filter(s => s.type === filter);

  grid.innerHTML = list.map(s => {
    const cap = s.maxCapacity || s.capacity;
    const basePrice = fmt(s.pricePerHour * s.minHours);
    return `
      <div class="space-card fade-up" data-id="${s.id}" role="button" tabindex="0">
        <div class="card-thumb">
          ${buildThumb(s)}
          <span class="card-floor-badge">${s.floor}</span>
          <span class="card-type-badge">${s.typeLabel}</span>
        </div>
        <div class="card-body">
          <div class="card-name">${s.name}</div>
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
              <span class="meta-value">${basePrice}원</span>
            </div>
            <button class="card-cta">신청하기</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  /* 이벤트 위임 */
  grid.addEventListener('click', e => {
    const card = e.target.closest('.space-card');
    if (!card) return;
    openModal(card.dataset.id);
  });

  observeFadeUp();
}

/* 썸네일: PNG가 있으면 <img>, 없으면 텍스트 플레이스홀더 */
function buildThumb(s) {
  if (s.image) {
    return `
      <img
        src="${s.image}"
        alt="${s.name}"
        class="card-thumb-img"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        loading="lazy"
      >
      <div class="card-thumb-fallback" style="display:none;">${s.imageFallback}</div>
    `;
  }
  return `<div class="card-thumb-fallback">${s.imageFallback}</div>`;
}

/* ── 프로세스 ───────────────────────────────────────────── */
function renderProcess(steps) {
  const el = document.querySelector('.steps');
  if (!el) return;
  el.innerHTML = steps.map(s => `
    <div class="step">
      <div class="step-icon">${ICONS[s.icon] || ''}</div>
      <div class="step-num" data-n="${s.num}">${s.num}</div>
      <div class="step-title">${s.title}</div>
      <div class="step-desc">${s.desc}</div>
    </div>
  `).join('');
}

/* ── 감면 기준 ──────────────────────────────────────────── */
function renderDiscounts(discounts) {
  const el = document.querySelector('.discount-grid');
  if (!el) return;
  el.innerHTML = discounts.map(d => `
    <div class="discount-item fade-up">
      <div class="discount-rate">${d.rate}<small>${d.unit}</small></div>
      <div>
        <div class="discount-info-title">${d.title}</div>
        <div class="discount-info-desc">${d.desc}</div>
      </div>
    </div>
  `).join('');
}

/* ── 이용 안내 ──────────────────────────────────────────── */
function renderRules(rules) {
  const el = document.querySelector('.rules-grid');
  if (!el) return;
  el.innerHTML = rules.map(r => `
    <div class="rules-card fade-up">
      <div class="rules-card-title">${r.title}</div>
      <ul class="rules-list">
        ${r.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

/* ── 신청 폼 셀렉트/옵션 렌더 ───────────────────────────── */
function renderApplySpaceSelect() {
  const sel = $('fSpace');
  if (!sel) return;
  sel.innerHTML = '<option value="">공간을 선택해 주세요</option>' +
    SPACES.map(s => `<option value="${s.id}">${s.name} (${s.floor})</option>`).join('');
}

function renderTimeSlots(slots) {
  const sel = $('fTime');
  if (!sel) return;
  sel.innerHTML = '<option value="">선택</option>' +
    slots.map(t => `<option>${t}</option>`).join('');
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
      <input type="checkbox" name="discount" value="${d.value}">
      <span>${d.title} (${d.rate} ${d.unit})</span>
    </label>
  `).join('');
  el.addEventListener('change', e => {
    const cb = e.target;
    if (!cb.matches('input[type="checkbox"]')) return;
    handleDiscount(cb);
  });
}

/* ── 모달 (공간 상세) ───────────────────────────────────── */
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
      `<span class="feature-tag">${f}</span>`
    ).join('');
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

/* ── 신청 모달 ──────────────────────────────────────────── */
function openApply(spaceId) {
  if (spaceId) {
    $('fSpace').value = spaceId;
    const s = SPACES.find(x => x.id === spaceId);
    $('selectedSpaceBadge').style.display = 'inline-flex';
    $('selectedSpaceName').textContent = s.name;
  } else {
    $('selectedSpaceBadge').style.display = 'none';
  }

  /* 예약 가능 날짜 범위 */
  const { minDaysAhead, maxDaysAhead } = (window._bookingWindow || { minDaysAhead: 7, maxDaysAhead: 30 });
  const today = new Date();
  const min = new Date(today); min.setDate(today.getDate() + minDaysAhead);
  const max = new Date(today); max.setDate(today.getDate() + maxDaysAhead);
  $('fDate').min = min.toISOString().split('T')[0];
  $('fDate').max = max.toISOString().split('T')[0];

  $('formState').style.display   = 'block';
  $('successState').style.display = 'none';
  currentDiscountRate = 0;
  document.querySelectorAll('#discountCheckboxes input[type="checkbox"]')
    .forEach(c => c.checked = false);

  updatePrice();
  $('applyOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeApply() {
  $('applyOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── 감면 처리 ──────────────────────────────────────────── */
function handleDiscount(cb) {
  document.querySelectorAll('#discountCheckboxes input[type="checkbox"]')
    .forEach(c => { if (c !== cb) c.checked = false; });
  currentDiscountRate = cb.checked ? parseInt(cb.value) : 0;
  updatePrice();
}

/* ── 요금 실시간 계산 ────────────────────────────────────── */
function updatePrice() {
  const spaceId  = $('fSpace')?.value;
  const duration = parseInt($('fDuration')?.value) || 1;
  const priceEl  = $('priceDisplay');
  const noteEl   = $('priceNote');
  if (!priceEl) return;

  if (!spaceId) { priceEl.textContent = '—'; noteEl.textContent = ''; return; }

  const s     = SPACES.find(x => x.id === spaceId);
  const base  = s.pricePerHour * duration;
  const final = currentDiscountRate === 100 ? 0 : Math.round(base * (1 - currentDiscountRate / 100));

  priceEl.textContent = final === 0 ? '무료' : `${fmt(final)}원`;
  noteEl.textContent  = currentDiscountRate > 0
    ? `(${fmt(base)}원 → ${currentDiscountRate}% 감면)`
    : `(${duration}시간 기준)`;
}

/* ── 신청 제출 ──────────────────────────────────────────── */
async function submitApply() {
  const fields = {
    name:    $('fName')?.value.trim(),
    phone:   $('fPhone')?.value.trim(),
    email:   $('fEmail')?.value.trim(),
    org:     $('fOrg')?.value.trim(),
    spaceId: $('fSpace')?.value,
    date:    $('fDate')?.value,
    time:    $('fTime')?.value,
    duration: parseInt($('fDuration')?.value) || 1,
    count:   $('fCount')?.value,
    purpose: $('fPurpose')?.value.trim()
  };

  if (!fields.name || !fields.phone || !fields.email || !fields.spaceId || !fields.date || !fields.time) {
    alert('성명, 연락처, 이메일, 공간, 날짜, 시간은 필수 항목입니다.');
    return;
  }

  const s     = SPACES.find(x => x.id === fields.spaceId);
  const base  = s.pricePerHour * fields.duration;
  const final = currentDiscountRate === 100 ? 0 : Math.round(base * (1 - currentDiscountRate / 100));
  const finalStr = final === 0 ? '무료' : `${fmt(final)}원`;

  /* Apps Script 연동 */
  if (SITE.appsScriptUrl) {
    try {
      await fetch(SITE.appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({
          ...fields,
          spaceName: s.name,
          discountRate: currentDiscountRate,
          basePrice: base,
          finalPrice: final
        })
      });
    } catch (err) {
      console.error('신청 전송 실패:', err);
    }
  }

  /* 완료 화면 */
  $('successAmountBox').textContent    = finalStr;
  $('successDepositorName').textContent = fields.name;
  $('successBankName').textContent     = ACCOUNT.bank;
  $('successAccountNum').textContent   = ACCOUNT.number;
  $('successAccountHolder').textContent = ACCOUNT.holder;
  $('successDeadline').textContent     = ACCOUNT.deadline;

  $('formState').style.display    = 'none';
  $('successState').style.display = 'block';
}

/* ── Intersection Observer (fade-up) ───────────────────── */
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

/* ── 초기화 ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  /* bookingWindow 저장 */
  const siteRes = await fetch('data/site.json');
  const siteData = await siteRes.json();
  window._bookingWindow = siteData.bookingWindow;

  /* 공통 이벤트 */
  $('fSpace')?.addEventListener('change', updatePrice);
  $('fDuration')?.addEventListener('change', updatePrice);

  $('modalOverlay')?.addEventListener('click', closeModal);
  $('applyOverlay')?.addEventListener('click', e => {
    if (e.target === $('applyOverlay')) closeApply();
  });

  document.querySelector('.hero-cta')?.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('#spaces')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelector('.cta-apply-btn')?.addEventListener('click', () => openApply(null));

  /* 전역 접근용 (HTML onclick 최소화) */
  window.openApply  = openApply;
  window.closeApply = closeApply;
  window.closeModal = closeModal;
  window.submitApply = submitApply;
});
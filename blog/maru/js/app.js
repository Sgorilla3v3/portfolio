/* ============================================================
   app.js — 상상마루 대관 홈페이지
============================================================ */

let SPACES  = [];
let SITE    = {};
let ACCOUNT = {};
let _timeSlots     = [];
let _durationOpts  = [];
let currentDiscountRate = 0;
let occupiedSlots       = [];
let selectedTime        = null;   // 박스 그리드에서 선택된 시간

/* ── 공간별 신청 가능 기간 반환
   우선순위: spaces.json 공간별 설정 > site.json 전역 bookingWindow > 코드 기본값 */
function getBookingWindow(spaceId) {
  const space   = SPACES.find(s => s.id === spaceId);
  const global  = window._bookingWindow || {};
  return {
    minDaysAhead: space?.minDaysAhead ?? global.minDaysAhead ?? 7,
    maxDaysAhead: space?.maxDaysAhead ?? global.maxDaysAhead ?? 30,
  };
}

/* ── XSS 방지 ── */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}

/* ── 아이콘 ── */
const ICONS = {
  grid:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  edit:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  card:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`,
  check:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>`,
  arrow:`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>`,
  pin:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
};

const $ = id => document.getElementById(id);
const fmt = n => { const v = Number(n); return isNaN(v) ? '0' : v.toLocaleString('ko-KR'); };

/* ── 입력 검증 규칙 ── */
const RULES = {
  // 이름: 한글(첫 글자 반드시 한글 또는 영문, 이후 한글·영문·점·중간 공백 허용)
  // 공백 연속·앞뒤 공백·숫자·특수문자 불가
  name: {
    maxLen: 30,
    pattern: /^[가-힣a-zA-Z][가-힣a-zA-Z·\s]{0,28}[가-힣a-zA-Z]$|^[가-힣a-zA-Z]{1,30}$/,
    msg: '성명은 한글 또는 영문으로만 입력해 주세요. (숫자·특수문자 불가)',
    sanitize: v => v.replace(/[<>"'&]/g, '').replace(/\s{2,}/g, ' ').trim(),
  },
  // 전화번호: 휴대폰(010~019) + 지역번호(02, 031~064, 070) + 하이픈 선택
  phone: {
    maxLen: 20,
    pattern: /^(01[016789]|02|0[3-9]\d{1})-?\d{3,4}-?\d{4}$/,
    msg: '올바른 전화번호를 입력해 주세요. (예: 010-1234-5678 또는 054-000-0000)',
    sanitize: v => v.replace(/[^\d\-]/g, '').trim(),
  },
  // 이메일: 표준 이메일 형식 + 공격 문자 차단
  email: {
    maxLen: 100,
    pattern: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
    msg: '올바른 이메일 주소를 입력해 주세요. (예: name@example.com)',
    sanitize: v => v.replace(/[<>"'\s]/g, '').trim(),
  },
  // 단체명: 한글·영문·숫자·공백·()·[]·점·하이픈만 허용
  org: {
    maxLen: 60,
    pattern: /^[가-힣a-zA-Z0-9\s()\[\]\.\-]{0,60}$/,
    msg: '단체명에 사용할 수 없는 문자가 포함되어 있습니다.',
    sanitize: v => v.replace(/[<>"'&]/g, '').trim(),
  },
  // 입금자명: 한글·영문·공백만 허용
  depositor: {
    maxLen: 30,
    pattern: /^[가-힣a-zA-Z][가-힣a-zA-Z\s]{0,29}$|^[가-힣a-zA-Z]{1}$/,
    msg: '입금자명은 한글 또는 영문으로만 입력해 주세요.',
    sanitize: v => v.replace(/[^가-힣a-zA-Z\s]/g, '').trim(),
  },
  // 사용목적: HTML 태그·스크립트·SQL 인젝션 패턴 차단
  purpose: {
    maxLen: 300,
    pattern: /^[^<>"'`\x00-\x1f]*$/,
    msg: '사용 목적에 사용할 수 없는 문자가 포함되어 있습니다. (< > " ' 불가)',
    sanitize: v => v.replace(/[<>"'`]/g, '').replace(/\x00-\x1f/g, '').trim(),
  },
};

/* 값 검증 + 선택적 새니타이즈 */
function validateField(id, rule) {
  const el = $(id); if (!el) return null;
  const val = el.value.trim();
  if (!val) return null; // 빈값은 필수 체크에서 별도 처리
  if (rule.maxLen && val.length > rule.maxLen)
    return `${rule.maxLen}자 이내로 입력해 주세요.`;
  if (rule.pattern && !rule.pattern.test(val))
    return rule.msg;
  return null;
}

/* 제출 직전 값 새니타이즈 (공격 문자 제거 후 반환) */
function sanitize(val, rule) {
  if (!rule?.sanitize) return val.trim();
  return rule.sanitize(val);
}
function showFieldError(id, msg) {
  clearFieldError(id);
  const el = $(id); if (!el) return;
  el.classList.add('field-error');
  const e = document.createElement('div');
  e.className='field-error-msg'; e.id=id+'_err'; e.textContent=msg;
  el.parentNode.appendChild(e);
}
function clearFieldError(id) {
  $(id)?.classList.remove('field-error');
  $(id+'_err')?.remove();
}
function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach(e=>e.classList.remove('field-error'));
  document.querySelectorAll('.field-error-msg').forEach(e=>e.remove());
  const b = $('formErrorMsg'); if(b) b.style.display='none';
}

/* ============================================================
   데이터 로드
============================================================ */
async function loadData() {
  const [sr, siteR] = await Promise.all([
    fetch('data/spaces.json'), fetch('data/site.json'),
  ]);
  const sd = await sr.json(), siteD = await siteR.json();
  SPACES = sd.spaces; SITE = siteD.site; ACCOUNT = siteD.account;
  _timeSlots = siteD.timeSlots; _durationOpts = siteD.durationOptions;
  window._bookingWindow = siteD.bookingWindow;
  applyMeta(siteD);
  renderAll(sd, siteD);
}

function applyMeta(data) {
  const { site, nav, footer } = data;
  document.title = `${site.name} | 공간 대관`;
  const logo = site.name.replace(site.nameHighlight, `<span>${site.nameHighlight}</span>`);
  document.querySelectorAll('.nav-logo,.footer-logo').forEach(el => el.innerHTML = logo);
  const ht = document.querySelector('.hero-tag');
  if (ht) ht.textContent = site.subtitle;
  const hTitle = document.querySelector('.hero-title');
  if (hTitle) hTitle.innerHTML = site.heroTitle.split('\n').map(l =>
    l === site.heroTitleHighlight ? `<em>${l}</em>` : l
  ).join('<br>');
  const hDesc = document.querySelector('.hero-desc');
  if (hDesc) hDesc.innerHTML = site.heroDesc.replace('\n','<br>');
  const fi = document.querySelector('.footer-info');
  if (fi) fi.innerHTML = `${esc(site.address)}<br>대관 문의 : ${esc(site.phone)} &nbsp;|&nbsp; ${esc(site.officeHours)}`;
  const nl = document.querySelector('.nav-links');
  if (nl) {
    nl.innerHTML = nav.map(n=>`<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('')
      +`<li class="nav-cta"><a href="#" id="navApplyBtn">대관 신청</a></li>`;
    $('navApplyBtn')?.addEventListener('click', e=>{e.preventDefault();openApply(null);});
  }
  const fl = document.querySelector('.footer-links');
  if (fl) fl.innerHTML = data.footer.map(f=>`<li><a href="${esc(f.href)}">${esc(f.label)}</a></li>`).join('');
  const se = $('heroStats');
  if (se) se.innerHTML = data.stats.map(s=>`
    <div class="hero-stat-card">
      <div class="hero-stat-num">${esc(s.num)}</div>
      <div class="hero-stat-label">${esc(s.label)}</div>
    </div>`).join('');
  document.querySelectorAll('.btn-tel').forEach(el=>{el.href=`tel:${site.phone}`;el.textContent='전화 문의';});
}

function renderAll(sd, siteD) {
  renderFilters(sd.filters);
  renderCards('all');
  renderProcess(siteD.process);
  renderDiscounts(siteD.discounts);
  renderRules(siteD.rules);
  renderApplySpaceSelect();
  renderDurationOptions(siteD.durationOptions);
  renderDiscountCheckboxes(siteD.discounts);
  observeFadeUp();
}

function renderFilters(filters) {
  const el = document.querySelector('.filter-tabs'); if(!el) return;
  el.innerHTML = filters.map((f,i)=>`<button class="filter-btn${i===0?' active':''}" data-filter="${esc(f.key)}">${esc(f.label)}</button>`).join('');
  el.addEventListener('click', e=>{
    const btn=e.target.closest('.filter-btn'); if(!btn) return;
    el.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); renderCards(btn.dataset.filter);
  });
}

function renderCards(filter='all') {
  const grid=$('spaceGrid'); if(!grid) return;
  const list = filter==='all' ? SPACES : SPACES.filter(s=>s.type===filter);
  grid.innerHTML = list.map(s=>{
    const cap = s.maxCapacity||s.capacity;
    return `<div class="space-card fade-up" data-id="${esc(s.id)}" role="button" tabindex="0">
      <div class="card-thumb">${buildThumb(s)}
        <span class="card-floor-badge">${esc(s.floor)}</span>
        <span class="card-type-badge">${esc(s.typeLabel)}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${esc(s.name)}</div>
        <div class="card-capacity">최대 <strong>${cap}명</strong> 수용</div>
        <div class="card-meta">
          <div class="card-meta-item"><span class="meta-label">기본 시간</span><span class="meta-value">${s.minHours}시간</span></div>
          <div class="card-meta-item"><span class="meta-label">시간당 요금</span><span class="meta-value">${fmt(s.pricePerHour)}원</span></div>
          <div class="card-meta-item"><span class="meta-label">기본 요금</span><span class="meta-value">${fmt(s.pricePerHour*s.minHours)}원</span></div>
          <button class="card-cta">신청하기</button>
        </div>
      </div>
    </div>`;
  }).join('');
  grid.addEventListener('click', e=>{
    const card=e.target.closest('.space-card'); if(!card) return;
    openModal(card.dataset.id);
  });
  observeFadeUp();
}

function buildThumb(s) {
  if (s.image) return `<img src="${esc(s.image)}" alt="${esc(s.name)}" class="card-thumb-img"
    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" loading="lazy">
    <div class="card-thumb-fallback" style="display:none;">${esc(s.imageFallback)}</div>`;
  return `<div class="card-thumb-fallback">${esc(s.imageFallback)}</div>`;
}

function renderProcess(steps) {
  const el=document.querySelector('.steps'); if(!el) return;
  el.innerHTML=steps.map(s=>`<div class="step"><div class="step-accent-line"></div><div class="step-icon">${ICONS[s.icon]||''}</div><div class="step-num">${esc(s.num)}</div><div class="step-title">${esc(s.title)}</div><div class="step-desc">${esc(s.desc)}</div></div>`).join('');
}
function renderDiscounts(discounts) {
  const el=document.querySelector('.discount-grid'); if(!el) return;
  el.innerHTML=discounts.map(d=>`<div class="discount-item fade-up"><div class="discount-rate">${esc(d.rate)}<small>${esc(d.unit)}</small></div><div><div class="discount-info-title">${esc(d.title)}</div><div class="discount-info-desc">${esc(d.desc)}</div></div></div>`).join('');
}
function renderRules(rules) {
  const el=document.querySelector('.rules-grid'); if(!el) return;
  el.innerHTML=rules.map(r=>`<div class="rules-card fade-up"><div class="rules-card-title">${esc(r.title)}</div><ul class="rules-list">${r.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`).join('');
}
function renderApplySpaceSelect() {
  const sel=$('fSpace'); if(!sel) return;
  sel.innerHTML='<option value="">공간을 선택해 주세요</option>'+
    SPACES.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} (${esc(s.floor)})</option>`).join('');
}
function renderDurationOptions(opts) {
  const html = opts.map(h=>`<option value="${h}"${h===3?' selected':''}>${h}시간</option>`).join('');
  // 패널1용(구버전 잔재) + 패널2용 모두 렌더
  const sel1 = $('fDuration');  if(sel1) sel1.innerHTML = html;
  const sel2 = $('fDuration2'); if(sel2) sel2.innerHTML = html;
}
function renderDiscountCheckboxes(discounts) {
  const el=$('discountCheckboxes'); if(!el) return;
  el.innerHTML=discounts.map(d=>`<label class="checkbox-item"><input type="checkbox" name="discount" value="${Number(d.value)}"><span>${esc(d.title)} (${esc(d.rate)} ${esc(d.unit)})</span></label>`).join('');
  el.addEventListener('change', e=>{
    const cb=e.target; if(!cb.matches('input[type="checkbox"]')) return; handleDiscount(cb);
  });
}

/* ============================================================
   모달 — 공간 상세
============================================================ */
/* ============================================================
   공간 상세 모달 — 캘린더 내장형
============================================================ */
let _modalSpaceId  = null;   // 현재 열린 공간 ID
let _calYear       = 0;
let _calMonth      = 0;      // 0-indexed
let _calSelected   = null;   // 'YYYY-MM-DD'
let _calTimeSelected = null; // 'HH:MM'
let _calOccupied   = [];

function openModal(id) {
  const s = SPACES.find(x => x.id === id); if (!s) return;
  _modalSpaceId    = id;
  _calSelected     = null;
  _calTimeSelected = null;
  _calOccupied     = [];

  /* 좌측 정보 */
  $('modalThumbWrap').innerHTML = buildThumb(s);
  $('modalTag').textContent  = `${s.floor} · ${s.typeLabel}`;
  $('modalName').textContent = s.name;
  $('modalTopbarTitle').textContent = s.name;
  $('modalDesc').textContent = s.desc;

  $('modalSpecList').innerHTML = [
    { key:'수용 인원', val:`<strong>${s.maxCapacity||s.capacity}</strong>명` },
    { key:'시간당 요금', val:`<strong>${fmt(s.pricePerHour)}</strong>원` },
    { key:'최소 이용', val:`<strong>${s.minHours}</strong>시간` },
    { key:'기본 요금', val:`<strong>${fmt(s.pricePerHour*s.minHours)}</strong>원~` },
  ].map(r => `
    <div class="modal-spec-row">
      <span class="modal-spec-key">${r.key}</span>
      <span class="modal-spec-val">${r.val}</span>
    </div>`).join('');

  if (s.features?.length) {
    $('modalFeatures').innerHTML = s.features.map(f =>
      `<span class="feature-tag">${esc(f)}</span>`).join('');
    $('modalFeatures').style.display = 'flex';
  } else { $('modalFeatures').style.display = 'none'; }

  /* 신청 버튼 */
  const applyBtn = $('modalApplyBtn');
  applyBtn.disabled = true;
  applyBtn.onclick = () => {
    closeModal();
    openApply(_modalSpaceId, _calSelected, _calTimeSelected);
  };

  /* 캘린더 초기화 — 공간별 신청 가능 첫 날짜 기준 월 */
  const { minDaysAhead } = getBookingWindow(id);
  const firstAvail = new Date();
  firstAvail.setDate(firstAvail.getDate() + minDaysAhead);
  _calYear  = firstAvail.getFullYear();
  _calMonth = firstAvail.getMonth();

  renderCalendar();
  $('calTimePanel').style.display = 'none';
  $('modalFooterSummary').textContent = '날짜와 시간을 선택하면 신청할 수 있습니다.';

  /* 이전/다음 버튼 */
  $('calPrevBtn').onclick = () => { _calMonth--; if(_calMonth<0){_calMonth=11;_calYear--;} renderCalendar(); };
  $('calNextBtn').onclick = () => { _calMonth++; if(_calMonth>11){_calMonth=0;_calYear++;} renderCalendar(); };

  $('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== $('modalOverlay')) return;
  $('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── 월별 캘린더 렌더 ── */
function renderCalendar() {
  const { minDaysAhead, maxDaysAhead } = getBookingWindow(_modalSpaceId);
  const today    = new Date(); today.setHours(0,0,0,0);
  const minDate  = new Date(today); minDate.setDate(today.getDate() + minDaysAhead);
  const maxDate  = new Date(today); maxDate.setDate(today.getDate() + maxDaysAhead);

  // 월 레이블
  const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  $('calMonthLabel').textContent = `${_calYear}년 ${MONTHS[_calMonth]}`;

  // 해당 월의 1일 요일, 마지막 날
  const firstDay  = new Date(_calYear, _calMonth, 1).getDay(); // 0=일
  const lastDate  = new Date(_calYear, _calMonth+1, 0).getDate();

  const grid = $('calGrid');
  let cells = '';

  // 앞 빈 칸
  for (let i = 0; i < firstDay; i++) {
    cells += '<div class="cal-day empty"></div>';
  }

  for (let d = 1; d <= lastDate; d++) {
    const date    = new Date(_calYear, _calMonth, d);
    const dateStr = `${_calYear}-${String(_calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow     = date.getDay(); // 0=일, 6=토

    const isPast     = date < minDate;
    const isOverMax  = date > maxDate;
    const isSunday   = dow === 0;
    const isSaturday = dow === 6;
    const isToday    = date.getTime() === today.getTime();
    const isSelected = dateStr === _calSelected;
    const isDisabled = isPast || isOverMax || isSunday;

    let cls = 'cal-day';
    if (isSelected) cls += ' selected';
    else if (isToday)    cls += ' today';
    if (isPast || isOverMax || isSunday) cls += ' disabled past';
    if (isSaturday && !isDisabled) cls += ' sat';
    if (isSunday) cls += ' sun';

    const onclick = isDisabled ? '' : `onclick="selectCalDay('${dateStr}')"`;
    const badge   = isDisabled ? '' : `<span class="cal-day-badge avail">가능</span>`;

    cells += `<div class="${cls}" ${onclick}>
      <span class="cal-day-num">${d}</span>
      ${badge}
    </div>`;
  }

  grid.innerHTML = cells;
}

/* ── 날짜 선택 ── */
async function selectCalDay(dateStr) {
  _calSelected     = dateStr;
  _calTimeSelected = null;
  $('modalApplyBtn').disabled = true;
  $('modalFooterSummary').textContent = '시간을 선택해 주세요.';

  renderCalendar();

  const tp = $('calTimePanel');
  tp.style.display = 'block';
  $('calTimeHeader').textContent = `${dateStr} 시작 시간`;
  $('calTimeGrid').innerHTML = '<div class="cal-time-empty">조회 중…</div>';

  const s = SPACES.find(x => x.id === _modalSpaceId);
  if (!s) { _calOccupied = []; renderCalTimeGrid(); return; }

  // 연결 공간 포함 슬롯 조회
  // ex) 상상마루홀 선택 시 상상홀·마루홀 예약도 함께 확인
  const linkedIds = s.linkedSpaces || [];
  const targets   = [s, ...linkedIds.map(id => SPACES.find(x => x.id === id)).filter(Boolean)];

  if (SITE.appsScriptUrl) {
    const results = await Promise.all(
      targets.map(sp => fetchAvailableSlots(sp.name, dateStr))
    );
    // 모든 공간의 occupied 슬롯을 병합 — 어느 하나라도 예약되면 불가
    _calOccupied = results.flatMap(r => (r && r.ok) ? (r.occupied || []) : []);
  } else {
    _calOccupied = [];
  }

  renderCalTimeGrid();
}

/* ── 시간 그리드 렌더 ── */
function renderCalTimeGrid() {
  const grid = $('calTimeGrid');
  if (!_timeSlots.length) { grid.innerHTML = '<div class="cal-time-empty">운영 시간 정보 없음</div>'; return; }

  grid.innerHTML = _timeSlots.map(t => {
    const h = parseInt(t);
    const isOccupied = _calOccupied.some(oc =>
      h >= parseInt(oc.start) && h < parseInt(oc.end)
    );
    const isSel = t === _calTimeSelected;
    return `<button
      class="cal-time-btn${isOccupied?' occupied':''}${isSel?' selected':''}"
      data-time="${esc(t)}"
      ${isOccupied ? 'disabled' : ''}
      onclick="selectCalTime('${esc(t)}')"
    >${esc(t)}${isOccupied?'<br><small>예약됨</small>':''}</button>`;
  }).join('');
}

/* ── 시간 선택 ── */
function selectCalTime(time) {
  _calTimeSelected = time;

  // 버튼 상태 갱신
  document.querySelectorAll('.cal-time-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.time === time);
  });

  // footer 요약
  const s = SPACES.find(x => x.id === _modalSpaceId);
  $('modalFooterSummary').innerHTML =
    `<strong>${esc(s.name)}</strong> · ${esc(_calSelected)} · ${esc(time)} 시작`;
  $('modalApplyBtn').disabled = false;
}

/* ============================================================
   패널 전환
============================================================ */
let currentPanel = 1;

function goToPanel(n) {
  currentPanel = n;
  $('applyPanels').style.transform = `translateX(${-(n-1)*100}%)`;

  // 단계 인디케이터 업데이트
  [1,2,3].forEach(i => {
    const item = $('stepIndicator'+i);
    const line = $('stepLine'+i);
    if (!item) return;
    item.classList.remove('active','done');
    if (i < n)      item.classList.add('done');
    else if (i === n) item.classList.add('active');
    if (line) line.classList.toggle('done', i < n);
  });

  // 패널3(완료)는 헤더 숨김
  $('applySteps').style.display = n === 3 ? 'none' : '';
  $('applyTitle').textContent = n === 1 ? '대관 신청' : n === 2 ? '신청 정보 입력' : '신청 완료';

  // 패널2 진입 시 — 선택 정보 요약 채우기 + 첫 필드 포커스
  if (n === 2) {
    updateSelectionSummary();
    setTimeout(() => $('fName')?.focus(), 350);
  }
}

/* 패널2 상단 선택 정보 요약 갱신 */
function updateSelectionSummary() {
  // selectedTime: 패널1 그리드에서 선택한 시간
  // _calTimeSelected: 공간 상세 모달 캘린더에서 선택한 시간
  // 둘 다 확인해서 있는 값 사용
  const spaceId = $('fSpace')?.value;
  const date    = $('fDate')?.value;
  const time    = selectedTime || _calTimeSelected;
  const s       = SPACES.find(x => x.id === spaceId);

  const sumSpace = $('sumSpace');
  const sumDate  = $('sumDate');
  const sumTime  = $('sumTime');

  if (sumSpace) sumSpace.textContent = s?.name || '—';
  if (sumDate)  sumDate.textContent  = date    || '—';
  if (sumTime)  sumTime.textContent  = time ? time + ' 시작' : '—';
}

/* ============================================================
   캘린더 슬롯 조회
============================================================ */
async function fetchAvailableSlots(spaceName, date) {
  const url = SITE.appsScriptUrl;
  if (!url || !spaceName || !date) return null;
  setSlotStatus('조회 중…', 'loading');
  try {
    const res = await fetch(
      `${url}?action=getAvailableSlots&spaceName=${encodeURIComponent(spaceName)}&date=${encodeURIComponent(date)}`
    );
    if (!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  } catch(e) {
    console.warn('슬롯 조회 실패:', e);
    return null;
  }
}

async function onSpaceOrDateChange() {
  const spaceId = $('fSpace')?.value;
  const date    = $('fDate')?.value;
  selectedTime  = null;

  $('timeSlotSection').style.display  = 'none';
  $('durationSection').style.display  = 'none';
  $('slotSummary').classList.remove('visible');
  $('toPanel2Btn').disabled = true;
  updatePrice();

  if (!spaceId || !date) {
    setSlotStatus('공간과 날짜를 모두 선택하면 가능한 시간을 표시합니다.', 'idle');
    return;
  }

  const space = SPACES.find(s=>s.id===spaceId);
  if (!space) return;

  const result = await fetchAvailableSlots(space.name, date);

  if (result && result.ok) {
    occupiedSlots = result.occupied || [];
    const avail   = result.available?.length || 0;
    const occ     = result.occupied?.length  || 0;

    renderTimeSlotGrid(occupiedSlots);
    $('timeSlotSection').style.display = 'block';

    if (avail === 0) {
      setSlotStatus(`이 날짜는 모든 시간이 예약되어 있습니다. 다른 날짜를 선택해 주세요.`, 'full');
    } else {
      setSlotStatus(`${avail}개 시간 선택 가능${occ>0?' ('+occ+'개 예약됨)':''}`, 'ok');
    }
  } else {
    occupiedSlots = [];
    renderTimeSlotGrid([]);
    $('timeSlotSection').style.display = 'block';
    setSlotStatus('시간 조회를 건너뜁니다. 시간 선택 후 신청 시 서버에서 재확인합니다.', 'warn');
  }
}

function setSlotStatus(msg, type) {
  const el=$('slotStatus'); if(!el) return;
  el.textContent=msg; el.dataset.type=type;
}

/* ── 시간 박스 그리드 렌더 ── */
function renderTimeSlotGrid(occupied) {
  const grid=$('timeSlotGrid'); if(!grid) return;
  grid.innerHTML = _timeSlots.map(t => {
    const h = parseInt(t);
    const isOccupied = occupied.some(oc =>
      h >= parseInt(oc.start) && h < parseInt(oc.end)
    );
    const isSel = t === selectedTime;
    return `<button
      class="time-slot-btn${isOccupied?' occupied':''}${isSel?' selected':''}"
      data-time="${esc(t)}"
      ${isOccupied ? 'disabled' : ''}
      onclick="selectTimeSlot('${esc(t)}')"
    >
      <span class="slot-label">${esc(t)}</span>
      ${isOccupied ? '<span class="slot-badge">예약됨</span>' : ''}
    </button>`;
  }).join('');
}

/* ── 시간 선택 ── */
function selectTimeSlot(time) {
  selectedTime = time;

  // 버튼 선택 상태 갱신
  document.querySelectorAll('.time-slot-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.time === time);
  });

  // 사용 시간 선택 노출
  $('durationSection').style.display = 'block';

  // 요약 업데이트
  updateSlotSummary();
  updatePrice();
}

function updateSlotSummary() {
  const spaceId  = $('fSpace')?.value;
  const date     = $('fDate')?.value;
  // 패널2의 fDuration2 우선, 없으면 fDuration 폴백
  const durEl2   = $('fDuration2') || $('fDuration');
  const duration = parseInt(durEl2?.value) || 1;
  const summary  = $('slotSummary');
  if (!summary) return;

  if (!spaceId || !date || !selectedTime) {
    summary.classList.remove('visible');
    $('toPanel2Btn').disabled = true;
    return;
  }

  const space = SPACES.find(s=>s.id===spaceId);
  const [sh] = selectedTime.split(':').map(Number);
  const endH  = sh + duration;
  const endStr = `${String(endH).padStart(2,'0')}:00`;

  summary.textContent = `${esc(space.name)} · ${esc(date)} · ${esc(selectedTime)} ~ ${endStr} (${duration}시간)`;
  summary.classList.add('visible');
  $('toPanel2Btn').disabled = false;
}

/* ============================================================
   신청 모달 열기
============================================================ */
function openApply(spaceId, preDate, preTime) {
  clearAllErrors();
  selectedTime    = null;
  occupiedSlots   = [];
  currentDiscountRate = 0;

  // 공간 사전 선택
  const s = SPACES.find(x => x.id === spaceId);
  if (spaceId && s) {
    $('fSpace').value = spaceId;
    $('selectedSpaceBadge').style.display = 'inline-flex';
    $('selectedSpaceName').textContent    = s.name;
  } else {
    $('fSpace').value = '';
    $('selectedSpaceBadge').style.display = 'none';
  }

  // 날짜 범위 — 공간별 설정 적용
  const { minDaysAhead, maxDaysAhead } = getBookingWindow(spaceId);
  const today = new Date();
  const minD = new Date(today); minD.setDate(today.getDate() + minDaysAhead);
  const maxD = new Date(today); maxD.setDate(today.getDate() + maxDaysAhead);
  $('fDate').min = minD.toISOString().split('T')[0];
  $('fDate').max = maxD.toISOString().split('T')[0];

  // 패널2 초기화
  document.querySelectorAll('#panel2 input, #panel2 textarea')
    .forEach(el => { el.value = ''; });
  const dur2 = $('fDuration2');
  if (dur2) dur2.value = _durationOpts.includes(3) ? '3' : (_durationOpts[0] || '1');
  document.querySelectorAll('#discountCheckboxes input[type="checkbox"]')
    .forEach(c => { c.checked = false; });

  // 항상 패널1부터 시작 — 모달에서 선택한 날짜·시간은 패널1에 채워서 보여줌
  goToPanel(1);

  if (preDate && preTime) {
    // 모달에서 날짜·시간 선택 후 진입 — 패널1에 값 채우고 슬롯 그리드도 복원
    $('fDate').value = preDate;
    selectedTime = preTime;

    // 슬롯 그리드 복원 — 모달에서 조회했던 occupied 재사용
    occupiedSlots = _calOccupied || [];
    renderTimeSlotGrid(occupiedSlots);
    $('timeSlotSection').style.display = 'block';

    // 선택된 시간 하이라이트
    setTimeout(() => {
      document.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.time === preTime);
      });
    }, 50);

    // 사용 시간·인원 섹션 노출
    $('durationSection').style.display = 'block';
    const dur1 = $('fDuration');
    if (dur1) dur1.value = s?.minHours || '1';

    // 상태 및 요약
    setSlotStatus(
      `${preDate} · ${s?.name || ''} — 시간을 확인하거나 사용 시간과 인원을 입력해 주세요.`,
      'ok'
    );
    updateSlotSummary();

  } else {
    // 일반 진입 — 날짜·시간 선택 안 된 상태
    $('fDate').value = '';
    $('timeSlotSection').style.display  = 'none';
    $('durationSection').style.display  = 'none';
    $('slotSummary').classList.remove('visible');
    $('toPanel2Btn').disabled = true;
    setSlotStatus('공간과 날짜를 선택하면 가능한 시간을 표시합니다.', 'idle');
    if (spaceId) setTimeout(() => $('fDate')?.focus(), 300);
  }

  updatePrice();
  $('applyOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeApply() {
  $('applyOverlay').classList.remove('open');
  document.body.style.overflow = '';
  clearAllErrors();
}

/* ── 감면 ── */
function handleDiscount(cb) {
  document.querySelectorAll('#discountCheckboxes input[type="checkbox"]')
    .forEach(c => { if(c!==cb) c.checked=false; });
  currentDiscountRate = cb.checked ? parseInt(cb.value) : 0;
  updatePrice();
}

/* ── 요금 계산 ── */
function updatePrice() {
  const spaceId  = $('fSpace')?.value;
  // 패널2의 fDuration2가 있으면 우선 사용, 없으면 패널1의 fDuration
  const durEl   = $('fDuration2') || $('fDuration');
  const duration = parseInt(durEl?.value) || 1;
  const priceEl  = $('priceDisplay');
  const noteEl   = $('priceNote');
  if (!priceEl) return;
  if (!spaceId) { priceEl.textContent='—'; if(noteEl) noteEl.textContent=''; return; }
  const s = SPACES.find(x => x.id === spaceId);
  if (!s || !s.pricePerHour) { priceEl.textContent='—'; return; }
  const base = Number(s.pricePerHour) * duration;
  const disc = Number(currentDiscountRate) || 0;
  const fin  = disc === 100 ? 0 : Math.round(base * (1 - disc / 100));
  if (isNaN(fin)) { priceEl.textContent='—'; return; }
  priceEl.textContent = fin === 0 ? '무료' : `${fmt(fin)}원`;
  if (noteEl) noteEl.textContent = disc > 0
    ? `(${fmt(base)}원 → ${disc}% 감면)` : `(${duration}시간 기준)`;
  updateSlotSummary();
}

/* ============================================================
   패널1 → 패널2 이동
============================================================ */
function proceedToForm() {
  const spaceId  = $('fSpace')?.value;
  const date     = $('fDate')?.value;
  const duration = parseInt($('fDuration')?.value) || 1;
  const countVal = parseInt($('fCount')?.value)    || 0;
  const time     = selectedTime;

  if (!spaceId) { setSlotStatus('공간을 선택해 주세요.', 'full'); return; }
  if (!date)    { setSlotStatus('날짜를 선택해 주세요.', 'full'); return; }
  if (!time)    { setSlotStatus('시작 시간을 선택해 주세요.', 'full'); return; }
  if (!duration || duration < 1) {
    showFieldError('fDuration', '사용 시간을 선택해 주세요.');
    return;
  }
  if (!countVal || countVal < 1 || countVal > 500) {
    $('fCount')?.focus();
    showFieldError('fCount', '예상 인원을 1~500 사이로 입력해 주세요.');
    return;
  }

  clearFieldError('fCount');
  clearFieldError('fDuration');

  // fDuration2도 패널1 값으로 맞춰줌 (패널2 요금 계산 기준)
  const dur2 = $('fDuration2');
  if (dur2) dur2.value = String(duration);

  goToPanel(2);
}

/* ============================================================
   신청 제출
============================================================ */
/* 1분 제출 제한 */
let _lastSubmitTime = 0;
const SUBMIT_COOLDOWN_MS = 60 * 1000; // 60초

async function submitApply() {
  clearAllErrors();

  /* ── 1분 제출 제한 체크 ── */
  const now = Date.now();
  if (now - _lastSubmitTime < SUBMIT_COOLDOWN_MS) {
    const remain = Math.ceil((SUBMIT_COOLDOWN_MS - (now - _lastSubmitTime)) / 1000);
    showFormError(`${remain}초 후에 다시 시도할 수 있습니다.`);
    return;
  }

  const spaceId  = $('fSpace')?.value;
  const date     = $('fDate')?.value;
  const durEl2   = $('fDuration2') || $('fDuration');
  const duration = parseInt(durEl2?.value) || 1;
  const countVal = parseInt($('fCount')?.value) || 0;

  /* 새니타이즈 후 값 추출 */
  const name      = sanitize($('fName')?.value      || '', RULES.name);
  const phone     = sanitize($('fPhone')?.value     || '', RULES.phone);
  const email     = sanitize($('fEmail')?.value     || '', RULES.email);
  const org       = sanitize($('fOrg')?.value       || '', RULES.org);
  const depositor = sanitize($('fDepositor')?.value || '', RULES.depositor);
  const purpose   = sanitize($('fPurpose')?.value   || '', RULES.purpose);

  let hasError = false;

  /* 필수 + 형식 통합 검증 */
  const check = (id, val, rule, requiredMsg) => {
    if (!val) { showFieldError(id, requiredMsg); hasError = true; return; }
    const err = rule ? validateField(id, rule) : null;
    if (err) { showFieldError(id, err); hasError = true; }
  };

  check('fName',  name,  RULES.name,  '성명을 입력해 주세요.');
  check('fPhone', phone, RULES.phone, '연락처를 입력해 주세요.');
  check('fEmail', email, RULES.email, '이메일을 입력해 주세요.');
  if (org)       { const e = validateField('fOrg',       RULES.org);       if(e){ showFieldError('fOrg',e);       hasError=true; } }
  if (depositor) { const e = validateField('fDepositor', RULES.depositor); if(e){ showFieldError('fDepositor',e); hasError=true; } }
  check('fPurpose', purpose, RULES.purpose, '사용 목적을 입력해 주세요.');

  if (hasError) {
    document.querySelector('.field-error')?.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }

  const s     = SPACES.find(x => x.id === spaceId);
  if (!s) { showFormError('공간 정보를 찾을 수 없습니다. 다시 시도해 주세요.'); return; }
  const base  = Number(s.pricePerHour) * duration;
  const disc  = Number(currentDiscountRate) || 0;
  const final = disc === 100 ? 0 : Math.round(base * (1 - disc / 100));

  const btn = $('submitBtn');
  if (btn) { btn.disabled=true; btn.textContent='처리 중…'; }

  if (!SITE.appsScriptUrl) {
    console.warn('[개발모드] appsScriptUrl 미설정');
    _lastSubmitTime = Date.now(); showSuccess({name,depositor,final});
    if(btn){btn.disabled=false;btn.textContent='신청 완료하기';}
    return;
  }

  try {
    const res = await fetch(SITE.appsScriptUrl, {
      method:'POST',
      body: JSON.stringify({
        name, phone, email, org,
        depositor: depositor||name,
        spaceId, spaceName: s.name,
        date, time: selectedTime, duration, count: countVal, purpose,
        discountRate: currentDiscountRate,
        discountLabel: $('discountCheckboxes')?.querySelector('input:checked')
          ?.closest('label')?.querySelector('span')?.textContent?.trim()||'',
        basePrice: base, finalPrice: final,
      }),
    });
    if (!res.ok) throw new Error('HTTP '+res.status);
    const result = await res.json();
    if (!result.ok) {
      showFormError(result.error||'신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      if(result.code==='SLOT_OCCUPIED') await onSpaceOrDateChange();
      if(btn){btn.disabled=false;btn.textContent='신청 완료하기';}
      return;
    }
    showSuccess({name,depositor,final});
  } catch(err) {
    console.error('신청 전송 실패:', err);
    showFormError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.');
    if(btn){btn.disabled=false;btn.textContent='신청 완료하기';}
  }
}

function showSuccess({name, depositor, final}) {
  const safeVal  = isNaN(Number(final)) ? 0 : Number(final);
  const finalStr = safeVal === 0 ? '무료' : `${fmt(safeVal)}원`;
  $('successAmountBox').textContent     = finalStr;
  $('successAmountInline').textContent  = finalStr;
  $('successDepositorName').textContent = depositor||name;
  $('successBankName').textContent      = ACCOUNT.bank;
  $('successAccountNum').textContent    = ACCOUNT.number;
  $('successAccountHolder').textContent = ACCOUNT.holder;
  $('successDeadline').textContent      = ACCOUNT.deadline;
  goToPanel(3);
}

function showFormError(msg) {
  let e=$('formErrorMsg');
  if(!e){
    e=document.createElement('div'); e.id='formErrorMsg'; e.className='form-error-banner';
    const btn=$('submitBtn'); btn?.parentNode.insertBefore(e,btn);
  }
  e.textContent=msg; e.style.display='block';
  e.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>{if(e)e.style.display='none';},6000);
}

/* ============================================================
   Intersection Observer
============================================================ */
function observeFadeUp() {
  const io=new IntersectionObserver((entries)=>{
    entries.forEach((entry,i)=>{
      if(entry.isIntersecting){
        setTimeout(()=>entry.target.classList.add('visible'),i*80);
        io.unobserve(entry.target);
      }
    });
  },{threshold:0.1});
  document.querySelectorAll('.fade-up:not(.visible)').forEach(el=>io.observe(el));
}

/* ============================================================
   초기화
============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  $('fSpace')?.addEventListener('change', () => { onSpaceOrDateChange(); updatePrice(); });
  $('fDate')?.addEventListener('change', onSpaceOrDateChange);
  $('fDuration')?.addEventListener('change',  () => { updatePrice(); updateSlotSummary(); });
  $('fDuration2')?.addEventListener('change', () => { updatePrice(); });
  $('fCount')?.addEventListener('input', () => clearFieldError('fCount'));
  $('toPanel2Btn')?.addEventListener('click', proceedToForm);

  // 입력 중: 오류 메시지 제거
  ['fName','fPhone','fEmail','fOrg','fDepositor','fPurpose'].forEach(id=>{
    $(id)?.addEventListener('input', ()=>clearFieldError(id));
  });
  // 포커스 해제 시: 형식 검증 + 새니타이즈
  const blurValidate = (id, rule) => {
    const el = $(id); if (!el) return;
    el.addEventListener('blur', () => {
      if (rule.sanitize) el.value = rule.sanitize(el.value);
      const err = validateField(id, rule);
      if (err) showFieldError(id, err);
      else clearFieldError(id);
    });
  };
  blurValidate('fName',      RULES.name);
  blurValidate('fPhone',     RULES.phone);
  blurValidate('fEmail',     RULES.email);
  blurValidate('fOrg',       RULES.org);
  blurValidate('fDepositor', RULES.depositor);
  blurValidate('fPurpose',   RULES.purpose);

  $('modalOverlay')?.addEventListener('click', closeModal);
  $('applyOverlay')?.addEventListener('click', e=>{
    if(e.target===$('applyOverlay')) closeApply();
  });

  document.querySelector('.hero-cta')?.addEventListener('click', e=>{
    e.preventDefault();
    document.querySelector('#spaces')?.scrollIntoView({behavior:'smooth'});
  });
  document.querySelector('.cta-apply-btn')?.addEventListener('click', ()=>openApply(null));

  window.openApply      = openApply;
  window.closeApply     = closeApply;
  window.closeModal     = closeModal;
  window.submitApply    = submitApply;
  window.goToPanel      = goToPanel;
  window.selectTimeSlot = selectTimeSlot;
  window.proceedToForm  = proceedToForm;
  window.selectCalDay          = selectCalDay;
  window.selectCalTime         = selectCalTime;
  window.updateSelectionSummary = updateSelectionSummary;
});
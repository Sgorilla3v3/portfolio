# 청도혁신센터 사업 참여자 대시보드

Google Sheets 데이터를 기반으로 한 실시간 대시보드 시스템

## 프로젝트 개요

- **데이터 소스**: Google Sheets
- **API 통신**: Google Apps Script (JSONP 방식)
- **배포 플랫폼**: GitHub Pages
- **차트 라이브러리**: Chart.js 4.4.1
- **반응형**: 데스크톱 브라우저 기준

## 파일 구조

```
청도혁신센터-대시보드/
├── index.html                 # 메인 허브 페이지
├── dashboards/
│   ├── 01_overview.html      # ✅ 전체 개요 대시보드 (완성)
│   ├── 02_program.html       # 🚧 프로그램 분석 (개발 예정)
│   ├── 03_region.html        # 🚧 지역별 분석 (개발 예정)
│   ├── 04_search.html        # 🚧 참여자 검색 (개발 예정)
│   └── 05_trend.html         # 🚧 트렌드 분석 (개발 예정)
├── css/
│   ├── common.css            # 공통 스타일
│   └── dashboard.css         # 대시보드 전용 스타일
├── js/
│   ├── config.js             # 설정 파일
│   ├── data-loader.js        # JSONP 데이터 로더
│   └── utils.js              # 유틸리티 함수
└── Code.gs                   # Google Apps Script
```

## 주요 기능

### 01. 전체 개요 대시보드 (완성)

- **KPI 카드**: 총 참여자, 활성 프로그램, 청도군 거주자 비율, 여성 참여율
- **프로그램별 도넛차트**: 상위 5개 프로그램 시각화
- **성별/연령대 막대차트**: 남성/여성별 연령대 분포
- **지역별 막대차트**: 상위 10개 지역 참여자 수

### 02-05. 나머지 대시보드 (개발 예정)

기본 레이아웃만 구성되어 있으며, 향후 개발 예정입니다.

## 배포 가이드

### 1단계: Google Sheets 준비

1. 새 Google Sheets 생성
2. 엑셀 데이터 붙여넣기
3. 시트명을 "raw"로 유지 (또는 Code.gs에서 수정)
4. 시트 URL에서 ID 복사:
   ```
   https://docs.google.com/spreadsheets/d/[이 부분이 SHEET_ID]/edit
   ```

### 2단계: Apps Script 배포

1. Google Sheets > 확장 프로그램 > Apps Script
2. `Code.gs` 파일 내용 복사/붙여넣기
3. **중요**: 첫 번째 줄의 `SHEET_ID` 수정:
   ```javascript
   const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';  // 여기에 실제 ID 입력
   ```
4. 저장 (Ctrl+S)
5. 배포 > 새 배포
   - 유형 선택: **웹 앱**
   - 실행 계정: **나**
   - 액세스 권한: **모든 사용자** ⚠️ 필수!
6. **배포 URL 복사** (다음 단계에서 사용)

### 3단계: HTML 파일 설정

1. `js/config.js` 파일 열기
2. `SCRIPT_URL` 수정:
   ```javascript
   SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
   ```
3. Apps Script 배포 URL로 교체

### 4단계: 로컬 테스트

1. Live Server 또는 로컬 웹 서버 실행
2. `index.html` 열기
3. 브라우저 콘솔(F12) 확인
4. 개발 도구 테스트:
   ```javascript
   devTools.testConnection()  // 연결 테스트
   devTools.getCacheStats()   // 캐시 상태 확인
   ```

### 5단계: GitHub Pages 배포

1. GitHub 저장소 생성
2. 모든 파일 업로드 (Code.gs 제외)
3. Settings > Pages
   - Source: **main** branch
   - 폴더: **/ (root)**
4. Save 후 URL 확인 (몇 분 소요)

## 트러블슈팅

### CORS 에러 발생

**원인**: Apps Script 배포 설정 오류

**해결**:
1. Apps Script > 배포 > 배포 관리
2. 액세스 권한이 "모든 사용자"인지 확인
3. 변경 후 **새 버전으로 배포** (필수!)

### 데이터가 로드되지 않음

**원인 1**: SCRIPT_URL 오류
- `js/config.js`에서 URL 재확인

**원인 2**: 시트 ID 오류
- `Code.gs`에서 SHEET_ID 재확인

**원인 3**: 캐시 문제
- 브라우저 콘솔에서 `devTools.clearCache()` 실행

### Apps Script 수정 후 반영 안 됨

**해결**:
1. Apps Script > 배포 > 배포 관리
2. 기존 배포 선택
3. 버전: **새 버전** 선택 (중요!)
4. 업데이트
5. HTML에서 캐시 버스팅이 자동으로 적용됨 (`?t=timestamp`)

## 개발 모드

`js/config.js`에서 `DEBUG: true`로 설정하면:

- 콘솔에 상세 로그 출력
- 개발 도구 사용 가능:
  - `devTools.clearCache()` - 캐시 초기화
  - `devTools.getCacheStats()` - 캐시 상태 확인
  - `devTools.testConnection()` - API 연결 테스트

## 보안 고려사항

1. **연락처 정보**: 현재 그대로 노출됨. 필요시 Apps Script에서 마스킹 처리
2. **Rate Limiting**: 높은 트래픽 예상 시 Apps Script에 구현 필요
3. **HTTPS**: GitHub Pages는 기본적으로 HTTPS 제공

## 성능 최적화

- **캐싱**: 데이터는 5분간 캐싱 (설정 변경 가능)
- **JSONP**: CORS 우회하며 빠른 로딩
- **Chart.js**: 경량 차트 라이브러리
- **CDN**: Chart.js는 CDN에서 로드

## 향후 개발 계획

1. 프로그램 분석 대시보드
   - 프로그램 선택 드롭다운
   - 상세 통계 및 차트
   
2. 지역별 분석 대시보드
   - 청도군 읍면동별 지도 (Leaflet.js)
   - 타지역 참여자 분석
   
3. 참여자 검색 대시보드
   - 다중 필터 기능
   - 페이지네이션 테이블
   
4. 트렌드 분석 대시보드
   - 시계열 차트
   - 예산년도별 비교

## 라이선스

MIT License

## 문의

청도혁신센터

---

**제작**: 2026년 1월  
**버전**: 1.0.0

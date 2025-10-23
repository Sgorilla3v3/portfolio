# Portfolio — 개발자 포트폴리오 사이트

간단한 정적 포트폴리오 웹사이트입니다. 개인 정보, 프로젝트, 미니게임, 블로그 링크 및 연락처를 포함합니다. GitHub Pages로 호스팅하도록 구성되어 있으며 커스텀 도메인 설정 파일 [`CNAME`](CNAME)가 포함되어 있습니다.

주요 파일 및 폴더
- 사이트 진입점: [index.html](index.html)
- 스타일 시트:
  - 기본 스타일: [assets/css/style.css](assets/css/style.css)
  - 다크 테마(예비): [assets/css/dark-theme.css](assets/css/dark-theme.css)
  - 반응형 보정: [assets/css/responsive.css](assets/css/responsive.css)
- 스크립트: [js/script.js](js/script.js)
  - 주요 함수: [`openGame`](js/script.js), [`openBlog`](js/script.js), [`addProject`](js/script.js), [`addGame`](js/script.js), [`addBlog`](js/script.js), [`saveToLocalStorage`](js/script.js), [`loadFromLocalStorage`](js/script.js)
- 정적 자산: [assets/images/](assets/images/)
- 미니게임(파일 보관용): [games/](games/)
- 커스텀 도메인: [CNAME](CNAME)

빠른 시작
1. 로컬에서 확인하려면 간단한 정적 서버를 사용하세요. 예:
   ```sh
   python3 -m http.server 8000
그런 다음 브라우저에서 http://localhost:8000 에 접속하여 index.html을 엽니다.
2. 또는 호스팅(예: GitHub Pages)에 푸시하여 배포할 수 있습니다. 커스텀 도메인은 CNAME에 설정되어 있습니다.

작동 방식 요약

네비게이션은 script.js에서 .nav-link 클릭으로 섹션 전환을 처리합니다.
모달을 통해 프로젝트/게임/블로그 항목을 추가하면 DOM에 카드가 동적으로 생성됩니다(addProject, addGame, addBlog).
로컬 스토리지에 항목을 저장/불러오는 유틸이 있으며 필요 시 활성화할 수 있습니다(saveToLocalStorage, loadFromLocalStorage).
수정 팁

스타일 조정: style.css에서 전역 색상/타이포/레이아웃 변경.
스크립트 확장: script.js에 게임 로딩 로직이나 서버 연동 추가.
게임 추가: games 폴더에 게임 파일을 추가하고 openGame에서 경로를 열도록 연결.
라이선스

본 저장소는 개인 포트폴리오용 예시입니다. 필요 시 사용/배포 규칙을 추가하세요.
변경 및 기여 방법

간단한 변경은 로컬에서 수정 후 커밋/푸시하세요.
미니게임을 실제로 실행하려면 games 내부에 각 게임의 HTML/자원 파일을 추가하고 index.html 또는 openGame에 경로를 연결하세요.
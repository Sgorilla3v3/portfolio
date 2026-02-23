/* ==========================================================================
   Portfolio Website - Main JavaScript
   ========================================================================== */

// ==========================================================================
// Navigation Functions
// ==========================================================================

// 네비게이션 기능
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 모든 네비게이션 링크에서 active 클래스 제거
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        // 클릭된 링크에 active 클래스 추가
        e.target.classList.add('active');
        
        // 모든 섹션 숨기기
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        
        // 해당 섹션 보이기
        const targetId = e.target.getAttribute('href').substring(1);
        document.getElementById(targetId).classList.add('active');
    });
});

// ==========================================================================
// Modal Functions
// ==========================================================================

// 모달 열기
function openModal() {
    const password = prompt('관리자 비밀번호를 입력하세요:');
    if (password === 'supersecret') {
        document.getElementById('projectModal').style.display = 'block';
    } else {
        alert('권한이 없습니다.');
    }
}

// 모달 닫기
function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
    document.getElementById('projectForm').reset();
    document.getElementById('gameIconGroup').style.display = 'none';
    document.getElementById('blogCategoryGroup').style.display = 'none';
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('projectModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ==========================================================================
// Form Handling
// ==========================================================================

// 프로젝트 타입 변경 시 필드 토글
document.getElementById('projectType').addEventListener('change', function() {
    const gameIconGroup = document.getElementById('gameIconGroup');
    const blogCategoryGroup = document.getElementById('blogCategoryGroup');
    
    // 모든 그룹 숨기기
    gameIconGroup.style.display = 'none';
    blogCategoryGroup.style.display = 'none';
    
    if (this.value === 'game') {
        gameIconGroup.style.display = 'block';
    } else if (this.value === 'blog') {
        blogCategoryGroup.style.display = 'block';
    }
});

// 프로젝트 추가 폼 제출
document.getElementById('projectForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('projectType').value;
    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDescription').value;
    const tech = document.getElementById('projectTech').value;
    const link = document.getElementById('projectLink').value;
    const icon = document.getElementById('gameIcon').value;
    const category = document.getElementById('blogCategory').value;

    if (type === 'project') {
        addProject(title, description, tech, link);
    } else if (type === 'game') {
        addGame(title, description, icon || '🎮');
    } else if (type === 'blog') {
        addBlog(title, description, category || '일반', link);
    }

    closeModal();
});

// ==========================================================================
// Content Adding Functions
// ==========================================================================

// 프로젝트 추가 함수
function addProject(title, description, tech, link) {
    const projectsGrid = document.getElementById('projectsGrid');
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    
    const techTags = tech ? tech.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('') : '';
    const linkHtml = link ? `<a href="${link}" class="project-link" target="_blank">자세히 보기</a>` : '';
    
    projectCard.innerHTML = `
        <button class="delete-btn" onclick="deleteProject(this)" title="삭제">×</button>
        <h3>${title}</h3>
        <p>${description}</p>
        <div class="tech-tags">${techTags}</div>
        ${linkHtml}
    `;
    
    projectsGrid.appendChild(projectCard);
}

// 게임 추가 함수
function addGame(title, description, icon) {
    const gamesGrid = document.getElementById('gamesGrid');
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.onclick = () => openGame(title.toLowerCase().replace(/\s+/g, ''));
    
    gameCard.innerHTML = `
        <button class="delete-btn" onclick="deleteGame(this)" title="삭제">×</button>
        <div class="game-icon">${icon}</div>
        <h3>${title}</h3>
        <p>${description}</p>
    `;
    
    gamesGrid.appendChild(gameCard);
}

// 블로그 추가 함수
function addBlog(title, description, category, link) {
    const blogGrid = document.getElementById('blogGrid');
    const blogCard = document.createElement('div');
    blogCard.className = 'blog-card';
    
    // 랜덤 그라데이션 색상
    const gradients = [
        'linear-gradient(135deg, #ff6b35 0%, #ffa726 100%)',
        'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
        'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
        'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
        'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
        'linear-gradient(135deg, #6c5ce7 0%, #74b9ff 100%)'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    
    const today = new Date().toLocaleDateString('ko-KR');
    const blogUrl = link || '#';
    
    blogCard.onclick = () => openBlog(blogUrl);
    
    blogCard.innerHTML = `
        <button class="delete-btn" onclick="deleteBlog(this)" title="삭제">×</button>
        <div class="blog-thumbnail" style="background: ${randomGradient};">
            <div class="blog-overlay">
                <h3>${title}</h3>
                <p class="blog-date">${today}</p>
                <span class="blog-category">${category}</span>
            </div>
        </div>
    `;
    
    blogGrid.appendChild(blogCard);
}

// ==========================================================================
// External Link Functions
// ==========================================================================
// 프로젝트 삭제
function deleteProject(button) {
    if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
        button.closest('.project-card').remove();
    }
}

// 게임 삭제  
function deleteGame(button) {
    if (confirm('이 게임을 삭제하시겠습니까?')) {
        button.closest('.game-card').remove();
    }
}

// 블로그 삭제
function deleteBlog(button) {
    if (confirm('이 블로그를 삭제하시겠습니까?')) {
        button.closest('.blog-card').remove();
    }
}
// 블로그 열기 함수
/* ==========================================================================
   Portfolio Website - Main JavaScript
   ========================================================================== */

// ==========================================================================
// Navigation Functions
// ==========================================================================

// 네비게이션 기능
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 모든 네비게이션 링크에서 active 클래스 제거
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        // 클릭된 링크에 active 클래스 추가
        e.target.classList.add('active');
        
        // 모든 섹션 숨기기
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        
        // 해당 섹션 보이기
        const targetId = e.target.getAttribute('href').substring(1);
        document.getElementById(targetId).classList.add('active');
    });
});

// ==========================================================================
// Modal Functions
// ==========================================================================

// 모달 열기
function openModal() {
    const password = prompt('관리자 비밀번호를 입력하세요:');
    if (password === 'supersecret') {
        document.getElementById('projectModal').style.display = 'block';
    } else {
        alert('권한이 없습니다.');
    }
}

// 모달 닫기
function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
    document.getElementById('projectForm').reset();
    document.getElementById('gameIconGroup').style.display = 'none';
    document.getElementById('blogCategoryGroup').style.display = 'none';
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('projectModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ==========================================================================
// Form Handling
// ==========================================================================

// 프로젝트 타입 변경 시 필드 토글
document.getElementById('projectType').addEventListener('change', function() {
    const gameIconGroup = document.getElementById('gameIconGroup');
    const blogCategoryGroup = document.getElementById('blogCategoryGroup');
    
    // 모든 그룹 숨기기
    gameIconGroup.style.display = 'none';
    blogCategoryGroup.style.display = 'none';
    
    if (this.value === 'game') {
        gameIconGroup.style.display = 'block';
    } else if (this.value === 'blog') {
        blogCategoryGroup.style.display = 'block';
    }
});

// 프로젝트 추가 폼 제출
document.getElementById('projectForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('projectType').value;
    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDescription').value;
    const tech = document.getElementById('projectTech').value;
    const link = document.getElementById('projectLink').value;
    const icon = document.getElementById('gameIcon').value;
    const category = document.getElementById('blogCategory').value;

    if (type === 'project') {
        addProject(title, description, tech, link);
    } else if (type === 'game') {
        addGame(title, description, icon || '🎮');
    } else if (type === 'blog') {
        addBlog(title, description, category || '일반', link);
    }

    closeModal();
});

// ==========================================================================
// Content Adding Functions
// ==========================================================================

// 프로젝트 추가 함수
function addProject(title, description, tech, link) {
    const projectsGrid = document.getElementById('projectsGrid');
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    
    const techTags = tech ? tech.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('') : '';
    const linkHtml = link ? `<a href="${link}" class="project-link" target="_blank">자세히 보기</a>` : '';
    
    projectCard.innerHTML = `
        <button class="delete-btn" onclick="deleteProject(this)" title="삭제">×</button>
        <h3>${title}</h3>
        <p>${description}</p>
        <div class="tech-tags">${techTags}</div>
        ${linkHtml}
    `;
    
    projectsGrid.appendChild(projectCard);
}

// 게임 추가 함수
function addGame(title, description, icon) {
    const gamesGrid = document.getElementById('gamesGrid');
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.onclick = () => openGame(title.toLowerCase().replace(/\s+/g, ''));
    
    gameCard.innerHTML = `
        <button class="delete-btn" onclick="deleteGame(this)" title="삭제">×</button>
        <div class="game-icon">${icon}</div>
        <h3>${title}</h3>
        <p>${description}</p>
    `;
    
    gamesGrid.appendChild(gameCard);
}

// 블로그 추가 함수
function addBlog(title, description, category, link) {
    const blogGrid = document.getElementById('blogGrid');
    const blogCard = document.createElement('div');
    blogCard.className = 'blog-card';
    
    // 랜덤 그라데이션 색상
    const gradients = [
        'linear-gradient(135deg, #ff6b35 0%, #ffa726 100%)',
        'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
        'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
        'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
        'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
        'linear-gradient(135deg, #6c5ce7 0%, #74b9ff 100%)'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    
    const today = new Date().toLocaleDateString('ko-KR');
    const blogUrl = link || '#';
    
    blogCard.onclick = () => openBlog(blogUrl);
    
    blogCard.innerHTML = `
        <button class="delete-btn" onclick="deleteBlog(this)" title="삭제">×</button>
        <div class="blog-thumbnail" style="background: ${randomGradient};">
            <div class="blog-overlay">
                <h3>${title}</h3>
                <p class="blog-date">${today}</p>
                <span class="blog-category">${category}</span>
            </div>
        </div>
    `;
    
    blogGrid.appendChild(blogCard);
}

// ==========================================================================
// External Link Functions
// ==========================================================================
// 프로젝트 삭제
function deleteProject(button) {
    if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
        button.closest('.project-card').remove();
    }
}

// 게임 삭제  
function deleteGame(button) {
    if (confirm('이 게임을 삭제하시겠습니까?')) {
        button.closest('.game-card').remove();
    }
}

// 블로그 삭제
function deleteBlog(button) {
    if (confirm('이 블로그를 삭제하시겠습니까?')) {
        button.closest('.blog-card').remove();
    }
}
function openBlog(url) {
    // URL이 없거나 빈 값이거나 '#'인 경우
    if (!url || url === '#' || url.trim() === '') {
        // 사용자에게 HTML 파일 경로 또는 URL 입력 받기
        const userInput = prompt(
            '블로그 링크를 입력해주세요:\n\n' +
            '• 외부 블로그 URL (예: https://myblog.com/post)\n' +
            '• HTML 파일 경로 (예: ./blog/posts/my-post.html)\n' +
            '• 상대 경로 (예: ../blog/index.html)'
        );
        
        if (userInput && userInput.trim() !== '') {
            const cleanInput = userInput.trim();
            
            // 입력값 검증 및 처리
            if (isValidUrl(cleanInput)) {
                window.open(cleanInput, '_blank');
            } else {
                alert('올바른 URL 또는 파일 경로를 입력해주세요.');
            }
        } else {
            alert('링크를 입력하지 않았습니다.');
        }
        return;
    }
    
    // URL이 제공된 경우 기존 로직 실행
    try {
        if (isValidUrl(url)) {
            window.open(url, '_blank');
        } else {
            alert('블로그 포스트를 열 수 없습니다. 유효한 링크를 확인해주세요.');
        }
    } catch (error) {
        console.error('블로그 열기 오류:', error);
        alert('블로그 포스트를 열 수 없습니다. URL을 확인해주세요.');
    }
}

// URL 또는 파일 경로 검증 함수
function isValidUrl(string) {
    // 빈 문자열 체크
    if (!string || string.trim() === '') {
        return false;
    }
    
    const trimmed = string.trim();
    
    // HTTP/HTTPS URL 체크
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
            new URL(trimmed);
            return true;
        } catch {
            return false;
        }
    }
    
    // HTML 파일 경로 체크
    if (trimmed.endsWith('.html') || trimmed.endsWith('.htm')) {
        return true;
    }
    
    // 상대 경로 체크 (./, ../, / 로 시작하는 경우)
    if (trimmed.startsWith('./') || trimmed.startsWith('../') || trimmed.startsWith('/')) {
        return true;
    }
    
    // 파일명만 있는 경우도 허용 (예: index.html)
    if (trimmed.includes('.html') || trimmed.includes('.htm')) {
        return true;
    }
    
    // 기타 상대 경로일 가능성도 허용
    return true;
}

// 게임 실행 함수 (실제 게임 파일이 있어야 동작)
function openGame(gameType) {
    switch(gameType) {
        case 'cheongdo':
            // 청도 팀 결정 게임 열기
            window.open('/games/teamG.html', '_blank');
            break;
        case 'tetris':
            // 테트리스 게임 열기
            window.open('/games/tetris.html', '_blank');
            break;
        case 'ladder':
            // 기억력 게임 열기
            window.open('/games/ladder.html', '_blank');
            break;
        case 'pong':
            // 퐁 게임 열기
            window.open('/games/pong.html', '_blank');
            break;
        case 'snake':
            // 스테이크 게임
            window.open('/games/snake.html', '_blank');
            break;
        case 'snake':
            // 스테이크 게임
            window.open('/games/snake.html', '_blank');
            break;
        default:
            alert('게임을 준비 중입니다!');
    }
}

// ==========================================================================
// Animation & Effects
// ==========================================================================

// 스크롤 애니메이션
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            section.style.animationDelay = '0s';
        }
    });
});

// ==========================================================================
// Local Storage Functions (Optional)
// ==========================================================================

// 로컬 스토리지에 프로젝트 저장/불러오기 기능
function saveToLocalStorage() {
    const projects = [];
    const games = [];
    const blogs = [];
    
    document.querySelectorAll('#projectsGrid .project-card').forEach(card => {
        const title = card.querySelector('h3').textContent;
        const description = card.querySelector('p').textContent;
        const techElements = card.querySelectorAll('.tech-tag');
        const tech = Array.from(techElements).map(el => el.textContent).join(', ');
        const linkElement = card.querySelector('.project-link');
        const link = linkElement ? linkElement.href : '';
        
        projects.push({ title, description, tech, link });
    });
    
    document.querySelectorAll('#gamesGrid .game-card').forEach(card => {
        const title = card.querySelector('h3').textContent;
        const description = card.querySelector('p').textContent;
        const icon = card.querySelector('.game-icon').textContent;
        
        games.push({ title, description, icon });
    });
    
    document.querySelectorAll('#blogGrid .blog-card').forEach(card => {
        const title = card.querySelector('h3').textContent;
        const date = card.querySelector('.blog-date').textContent;
        const category = card.querySelector('.blog-category').textContent;
        
        blogs.push({ title, date, category });
    });
    
    localStorage.setItem('portfolioProjects', JSON.stringify(projects));
    localStorage.setItem('portfolioGames', JSON.stringify(games));
    localStorage.setItem('portfolioBlogs', JSON.stringify(blogs));
}

function loadFromLocalStorage() {
    const projects = JSON.parse(localStorage.getItem('portfolioProjects') || '[]');
    const games = JSON.parse(localStorage.getItem('portfolioGames') || '[]');
    const blogs = JSON.parse(localStorage.getItem('portfolioBlogs') || '[]');
    
    projects.forEach(project => {
        addProject(project.title, project.description, project.tech, project.link);
    });
    
    games.forEach(game => {
        addGame(game.title, game.description, game.icon);
    });
    
    blogs.forEach(blog => {
        addBlog(blog.title, '', blog.category, '');
    });
}

// 페이지 로드 시 저장된 데이터 불러오기 (주석 처리됨)
// window.addEventListener('load', loadFromLocalStorage);

// ==========================================================================
// Initialization
// ==========================================================================

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio website loaded successfully!');
    
    // 초기 애니메이션 트리거
    setTimeout(() => {
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.animationDelay = '0s';
        });
    }, 100);
});

// 게임 실행 함수 (실제 게임 파일이 있어야 동작)
function openGame(gameType) {
    switch(gameType) {
        case 'snake':
            // 청도 팀 결정 게임 열기
            window.open('/games/teamG.html', '_blank');
            break;
        case 'tetris':
            // 테트리스 게임 열기
            window.open('/games/tetris.html', '_blank');
            break;
        case 'memory':
            // 기억력 게임 열기
            window.open('/games/memory.html', '_blank');
            break;
        case 'pong':
            // 퐁 게임 열기
            window.open('/games/pong.html', '_blank');
            break;
        case 'cheongdo':
            // 스네이크 게임
            window.open('/games/snake.html', '_blank');
            break;
        default:
            alert('게임을 준비 중입니다!');
    }
}

// ==========================================================================
// Animation & Effects
// ==========================================================================

// 스크롤 애니메이션
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            section.style.animationDelay = '0s';
        }
    });
});

// ==========================================================================
// Local Storage Functions (Optional)
// ==========================================================================

// 로컬 스토리지에 프로젝트 저장/불러오기 기능
function saveToLocalStorage() {
    const projects = [];
    const games = [];
    const blogs = [];
    
    document.querySelectorAll('#projectsGrid .project-card').forEach(card => {
        const title = card.querySelector('h3').textContent;
        const description = card.querySelector('p').textContent;
        const techElements = card.querySelectorAll('.tech-tag');
        const tech = Array.from(techElements).map(el => el.textContent).join(', ');
        const linkElement = card.querySelector('.project-link');
        const link = linkElement ? linkElement.href : '';
        
        projects.push({ title, description, tech, link });
    });
    
    document.querySelectorAll('#gamesGrid .game-card').forEach(card => {
        const title = card.querySelector('h3').textContent;
        const description = card.querySelector('p').textContent;
        const icon = card.querySelector('.game-icon').textContent;
        
        games.push({ title, description, icon });
    });
    
    document.querySelectorAll('#blogGrid .blog-card').forEach(card => {
        const title = card.querySelector('h3').textContent;
        const date = card.querySelector('.blog-date').textContent;
        const category = card.querySelector('.blog-category').textContent;
        
        blogs.push({ title, date, category });
    });
    
    localStorage.setItem('portfolioProjects', JSON.stringify(projects));
    localStorage.setItem('portfolioGames', JSON.stringify(games));
    localStorage.setItem('portfolioBlogs', JSON.stringify(blogs));
}

function loadFromLocalStorage() {
    const projects = JSON.parse(localStorage.getItem('portfolioProjects') || '[]');
    const games = JSON.parse(localStorage.getItem('portfolioGames') || '[]');
    const blogs = JSON.parse(localStorage.getItem('portfolioBlogs') || '[]');
    
    projects.forEach(project => {
        addProject(project.title, project.description, project.tech, project.link);
    });
    
    games.forEach(game => {
        addGame(game.title, game.description, game.icon);
    });
    
    blogs.forEach(blog => {
        addBlog(blog.title, '', blog.category, '');
    });
}

// 페이지 로드 시 저장된 데이터 불러오기 (주석 처리됨)
// window.addEventListener('load', loadFromLocalStorage);

// ==========================================================================
// Initialization
// ==========================================================================

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio website loaded successfully!');
    
    // 초기 애니메이션 트리거
    setTimeout(() => {
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.animationDelay = '0s';
        });
    }, 100);
});
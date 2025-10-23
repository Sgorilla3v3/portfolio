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
    document.getElementById('projectModal').style.display = 'block';
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

// 블로그 열기 함수
function openBlog(url) {
    if (url && url !== '#') {
        window.open(url, '_blank');
    } else {
        alert('블로그 포스트를 열 수 없습니다. 유효한 링크를 확인해주세요.');
    }
}

// 게임 실행 함수 (실제 게임 파일이 있어야 동작)
function openGame(gameId) {
    alert(`${gameId} 게임을 실행합니다!\n\n실제 구현에서는 게임 파일을 로드하거나\n새 창에서 게임을 실행할 수 있습니다.`);
    // 실제로는 게임 파일을 로드하거나 새 창을 열어야 합니다
    // window.open(`games/${gameId}.html`, '_blank');
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
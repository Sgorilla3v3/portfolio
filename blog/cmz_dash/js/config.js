/**
 * 청도혁신센터 대시보드 설정
 */
const CONFIG = {
    // Apps Script Web App URL
    // 배포 후 실제 URL로 변경 필요!
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwNmUs1KPndzF8thScRkKsxOvN3tAViG5TVkNBmfsuPKh9vO6pfaQtnQZ1I09Pc5dWfJg/exec',
    
    // 캐시 유효 시간 (밀리초)
    CACHE_TTL: 5 * 60 * 1000, // 5분
    
    // 디버그 모드
    DEBUG: true,
    
    // 차트 색상 팔레트
    COLORS: {
        primary: '#3498db',
        success: '#27ae60',
        warning: '#f39c12',
        danger: '#e74c3c',
        info: '#16a085',
        purple: '#9b59b6',
        gradient: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(74, 172, 254, 0.8)',
            'rgba(0, 242, 254, 0.8)',
            'rgba(67, 233, 123, 0.8)',
            'rgba(56, 249, 215, 0.8)',
            'rgba(250, 112, 154, 0.8)',
            'rgba(254, 225, 64, 0.8)'
        ]
    },
    
    // 차트 기본 옵션
    CHART_DEFAULTS: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    font: {
                        size: 12,
                        family: "'Noto Sans KR', sans-serif"
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 13
                }
            }
        }
    }
};

// 전역으로 노출
window.APP_CONFIG = CONFIG;

// 개발 환경 체크
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.warn('⚠️ 개발 환경입니다. SCRIPT_URL을 실제 배포 URL로 변경해주세요.');
    console.log('현재 SCRIPT_URL:', CONFIG.SCRIPT_URL);
}

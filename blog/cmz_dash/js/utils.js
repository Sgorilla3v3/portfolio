/**
 * 유틸리티 함수
 */

/**
 * 숫자를 천 단위 구분 기호로 포맷
 */
function formatNumber(num) {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('ko-KR');
}

/**
 * 퍼센트 포맷
 */
function formatPercent(value, total) {
    if (total === 0) return '0%';
    const percent = (value / total * 100).toFixed(1);
    return `${percent}%`;
}

/**
 * 날짜 포맷
 */
function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 로딩 표시
 */
function showLoading(element) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (!element) return;
    
    element.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

/**
 * 에러 표시
 */
function showError(element, message) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (!element) return;
    
    element.innerHTML = `
        <div class="error">
            <strong>오류 발생:</strong> ${message}
        </div>
    `;
}

/**
 * 성공 메시지 표시
 */
function showSuccess(element, message) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (!element) return;
    
    element.innerHTML = `
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>성공:</strong> ${message}
        </div>
    `;
}

/**
 * 디바운스 함수
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 배열을 특정 키로 그룹화
 */
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

/**
 * 배열에서 특정 키의 합계 계산
 */
function sumBy(array, key) {
    return array.reduce((sum, item) => sum + (item[key] || 0), 0);
}

/**
 * 배열에서 특정 키로 정렬
 */
function sortBy(array, key, descending = false) {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return descending ? 1 : -1;
        if (aVal > bVal) return descending ? -1 : 1;
        return 0;
    });
}

/**
 * 차트 색상 생성
 */
function getChartColors(count) {
    const colors = CONFIG.COLORS.gradient;
    const result = [];
    
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    
    return result;
}

/**
 * Chart.js 데이터셋 생성 헬퍼
 */
function createChartDataset(label, data, options = {}) {
    return {
        label,
        data,
        backgroundColor: options.backgroundColor || getChartColors(data.length),
        borderColor: options.borderColor || options.backgroundColor || getChartColors(data.length),
        borderWidth: options.borderWidth !== undefined ? options.borderWidth : 1,
        ...options
    };
}

/**
 * DOM이 로드된 후 실행
 */
function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

/**
 * 로그 헬퍼
 */
const log = {
    info: (message, ...args) => {
        if (CONFIG.DEBUG) {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${message}`, ...args);
    },
    warn: (message, ...args) => {
        if (CONFIG.DEBUG) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
};

// 전역으로 노출
window.utils = {
    formatNumber,
    formatPercent,
    formatDate,
    showLoading,
    showError,
    showSuccess,
    debounce,
    groupBy,
    sumBy,
    sortBy,
    getChartColors,
    createChartDataset,
    ready,
    log
};

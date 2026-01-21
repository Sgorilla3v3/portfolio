/**
 * JSONP 데이터 로더 클래스
 * Google Apps Script Web App과 통신
 */
class DataLoader {
    constructor(scriptUrl) {
        this.scriptUrl = scriptUrl;
        this.cache = new Map();
        this.pendingRequests = new Map();
    }
    
    /**
     * 데이터 로드 (JSONP 방식)
     * @param {string} action - API 액션 이름
     * @param {Object} params - 쿼리 파라미터
     * @param {boolean} useCache - 캐시 사용 여부
     * @returns {Promise<any>} - 응답 데이터
     */
    async load(action, params = {}, useCache = true) {
        // 캐시 키 생성
        const cacheKey = this._getCacheKey(action, params);
        
        // 캐시 확인
        if (useCache && this._isCacheValid(cacheKey)) {
            utils.log.info(`Cache hit for ${action}`);
            return this.cache.get(cacheKey).data;
        }
        
        // 동일한 요청이 진행 중이면 대기
        if (this.pendingRequests.has(cacheKey)) {
            utils.log.info(`Waiting for pending request: ${action}`);
            return this.pendingRequests.get(cacheKey);
        }
        
        // 새 요청 생성
        const promise = this._makeRequest(action, params);
        this.pendingRequests.set(cacheKey, promise);
        
        try {
            const data = await promise;
            
            // 캐시 저장
            if (useCache) {
                this._setCache(cacheKey, data);
            }
            
            return data;
        } finally {
            // 완료된 요청 제거
            this.pendingRequests.delete(cacheKey);
        }
    }
    
    /**
     * JSONP 요청 실행
     */
    _makeRequest(action, params) {
        return new Promise((resolve, reject) => {
            // 콜백 함수명 생성
            const callbackName = `jsonp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // 전역 콜백 함수 등록
            window[callbackName] = (response) => {
                // 정리
                this._cleanup(callbackName);
                
                // 응답 처리
                if (response.success) {
                    utils.log.info(`Data loaded: ${action}`, response.data);
                    resolve(response.data);
                } else {
                    utils.log.error(`API error: ${action}`, response.error);
                    reject(new Error(response.error || 'Unknown error'));
                }
            };
            
            // URL 생성
            const url = this._buildUrl(action, params, callbackName);
            
            // 스크립트 태그 생성 및 로드
            const script = document.createElement('script');
            script.id = callbackName;
            script.src = url;
            
            // 에러 처리
            script.onerror = () => {
                this._cleanup(callbackName);
                reject(new Error('Failed to load script'));
            };
            
            // 타임아웃 설정 (30초)
            const timeout = setTimeout(() => {
                if (window[callbackName]) {
                    this._cleanup(callbackName);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
            
            // 타임아웃 ID 저장
            script.dataset.timeoutId = timeout;
            
            // 스크립트 로드
            document.body.appendChild(script);
            
            utils.log.info(`Loading data: ${action}`, params);
        });
    }
    
    /**
     * URL 생성
     */
    _buildUrl(action, params, callbackName) {
        const url = new URL(this.scriptUrl);
        url.searchParams.set('callback', callbackName);
        url.searchParams.set('action', action);
        url.searchParams.set('t', Date.now()); // 캐시 버스팅
        
        // 파라미터 추가
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, value);
            }
        });
        
        return url.toString();
    }
    
    /**
     * 캐시 키 생성
     */
    _getCacheKey(action, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        return `${action}?${sortedParams}`;
    }
    
    /**
     * 캐시 유효성 확인
     */
    _isCacheValid(cacheKey) {
        if (!this.cache.has(cacheKey)) {
            return false;
        }
        
        const cached = this.cache.get(cacheKey);
        const age = Date.now() - cached.timestamp;
        
        return age < CONFIG.CACHE_TTL;
    }
    
    /**
     * 캐시 저장
     */
    _setCache(cacheKey, data) {
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        // 캐시 크기 제한 (최대 50개)
        if (this.cache.size > 50) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
    
    /**
     * 스크립트 태그 및 콜백 정리
     */
    _cleanup(callbackName) {
        // 스크립트 태그 제거
        const script = document.getElementById(callbackName);
        if (script) {
            // 타임아웃 취소
            const timeoutId = script.dataset.timeoutId;
            if (timeoutId) {
                clearTimeout(parseInt(timeoutId));
            }
            script.remove();
        }
        
        // 콜백 함수 제거
        if (window[callbackName]) {
            delete window[callbackName];
        }
    }
    
    /**
     * 캐시 초기화
     */
    clearCache() {
        this.cache.clear();
        utils.log.info('Cache cleared');
    }
    
    /**
     * 특정 액션의 캐시만 삭제
     */
    clearCacheFor(action) {
        const keysToDelete = [];
        
        for (const [key] of this.cache) {
            if (key.startsWith(action)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
        utils.log.info(`Cache cleared for action: ${action}`);
    }
    
    /**
     * 캐시 상태 확인
     */
    getCacheStats() {
        const stats = {
            size: this.cache.size,
            keys: []
        };
        
        for (const [key, value] of this.cache) {
            const age = Date.now() - value.timestamp;
            stats.keys.push({
                key,
                age: Math.round(age / 1000) + 's',
                valid: age < CONFIG.CACHE_TTL
            });
        }
        
        return stats;
    }
}

// 전역 데이터 로더 인스턴스 생성
window.dataLoader = new DataLoader(CONFIG.SCRIPT_URL);

// 개발 도구
if (CONFIG.DEBUG) {
    window.devTools = {
        clearCache: () => window.dataLoader.clearCache(),
        getCacheStats: () => window.dataLoader.getCacheStats(),
        testConnection: async () => {
            try {
                const data = await window.dataLoader.load('getAllData', {}, false);
                console.log('Connection test successful!');
                console.log('Data sample:', data.slice(0, 3));
                return true;
            } catch (error) {
                console.error('Connection test failed:', error);
                return false;
            }
        }
    };
    
    console.log('🛠️ 개발 도구 사용 가능:');
    console.log('  devTools.clearCache() - 캐시 초기화');
    console.log('  devTools.getCacheStats() - 캐시 상태 확인');
    console.log('  devTools.testConnection() - 연결 테스트');
}

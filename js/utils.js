/**
 * 유틸리티 함수 모음
 * 재사용 가능한 헬퍼 함수들
 */

/**
 * 입력 문자열을 안전하게 처리 (XSS 방지)
 * @param {string} str - 입력 문자열
 * @returns {string} 이스케이프된 문자열
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"&]/g, function (char) {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;',
    };
    return entities[char] || char;
  });
}

/**
 * 디바운스 함수 - 함수 호출을 지연시켜 성능 최적화
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait) {
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
 * 랙의 월드 공간에서의 반치수를 계산 (회전 고려)
 * @param {THREE.Object3D} rack - 랙 객체
 * @returns {Object} {halfX, halfZ} 반치수
 */
export function getWorldHalfExtents(rack) {
  const w = rack.userData.config.width;
  const d = rack.userData.config.depth;
  const θ = rack.rotation.y; // Y축 회전 (라디안)
  const hx = w / 2,
    hz = d / 2;
  // X축·Z축으로 투영된 반치수
  const halfX = Math.abs(Math.cos(θ) * hx) + Math.abs(Math.sin(θ) * hz);
  const halfZ = Math.abs(Math.sin(θ) * hx) + Math.abs(Math.cos(θ) * hz);
  return { halfX, halfZ };
}

/**
 * 컬럼 문자(A/B/C/...)를 0-based 인덱스로 변환
 * @param {string} letter - 컬럼 문자
 * @returns {number} 인덱스
 */
export function columnLetterToIndex(letter) {
  return letter.toUpperCase().charCodeAt(0) - 65;
}

/**
 * 랙 설정 검증
 * @param {Object} config - 랙 설정 객체
 * @returns {boolean} 유효성 여부
 */
export function validateRackConfig(config) {
  return (
    config &&
    typeof config.rackId === 'string' &&
    typeof config.width === 'number' &&
    typeof config.depth === 'number' &&
    typeof config.height === 'number' &&
    typeof config.levels === 'number' &&
    typeof config.cells === 'number'
  );
}

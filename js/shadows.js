/**
 * 그림자 관리 유틸리티
 * Three.js 그림자 시스템을 관리하는 함수들을 제공합니다.
 */

/**
 * 메시에 그림자 설정을 적용합니다.
 * @param {THREE.Object3D} obj - Three.js 메시 객체
 * @param {boolean} enabled - 그림자 활성화 여부
 * @param {THREE.Mesh} floorMesh - 바닥 메시
 */
export function applyShadowToMesh(obj, enabled, floorMesh) {
  if (!obj.isMesh) return;

  // 각 메시의 역할에 따라 적절하게 그림자 설정
  if (obj.name === 'pillarStructure') {
    obj.castShadow = enabled;
    obj.receiveShadow = false;
  } else if (obj.name === 'plateStructure') {
    obj.castShadow = false;
    obj.receiveShadow = enabled;
  } else if (obj.name === 'shelfStructure') {
    obj.castShadow = false;
    obj.receiveShadow = enabled;
  } else if (obj === floorMesh) {
    obj.castShadow = false;
    obj.receiveShadow = enabled;
  } else if (obj.userData.isCell) {
    // 투명 셀 메시 (상호작용용) - 그림자 없음
    obj.castShadow = false;
    obj.receiveShadow = false;
  } else if (obj.userData.isCellContent) {
    // 셀 내용물 (실제 박스) - 그림자만 캐스트
    obj.castShadow = enabled;
    obj.receiveShadow = false;
  } else {
    // 기타 메시(파렛트 등)
    obj.castShadow = enabled;
    obj.receiveShadow = enabled;
  }
}

/**
 * 씬의 모든 객체에 그림자 설정을 적용합니다.
 * @param {boolean} enabled - 그림자 활성화 여부
 * @param {THREE.Scene} scene - Three.js 씬
 * @param {THREE.WebGLRenderer} renderer - Three.js 렌더러
 * @param {Object} lights - 라이트 객체들 {mainLight, spotLight, fillLight, rimLight}
 * @param {THREE.Mesh} floorMesh - 바닥 메시
 */
export function applyShadowSettings(enabled, scene, renderer, lights, floorMesh) {
  const { mainLight, spotLight, fillLight, rimLight } = lights;

  // 1) 렌더러 자체의 그림자 활성화/비활성화
  renderer.shadowMap.enabled = enabled;

  // 2) 주요 라이트의 그림자 설정
  mainLight.castShadow = enabled;
  if (spotLight) spotLight.castShadow = enabled;
  if (fillLight) fillLight.castShadow = enabled;
  if (rimLight) rimLight.castShadow = enabled;

  // 3) 씬의 모든 메시(mesh)에 대해 cast/receiveShadow 설정
  scene.traverse((obj) => {
    applyShadowToMesh(obj, enabled, floorMesh);
  });
}

/**
 * 그림자 품질 설정을 가져옵니다.
 * @param {string} quality - 품질 수준 ('low', 'medium', 'high')
 * @returns {Object} {mapType, mapSize}
 */
export function getShadowQualitySettings(quality, THREE) {
  switch (quality) {
    case 'low':
      return {
        mapType: THREE.BasicShadowMap,
        mapSize: 1024
      };
    case 'medium':
      return {
        mapType: THREE.PCFShadowMap,
        mapSize: 2048
      };
    case 'high':
      return {
        mapType: THREE.PCFSoftShadowMap,
        mapSize: 4096
      };
    default:
      return {
        mapType: THREE.PCFShadowMap,
        mapSize: 2048
      };
  }
}

/**
 * 라이트의 그림자 맵 크기를 업데이트합니다.
 * @param {THREE.Light} light - 라이트 객체
 * @param {number} mapSize - 그림자 맵 크기
 */
export function updateLightShadowMapSize(light, mapSize) {
  if (light && light.shadow) {
    light.shadow.mapSize.set(mapSize, mapSize);
    light.shadow.map?.dispose(); // 기존 그림자 맵 해제
    light.shadow.map = null;
  }
}

/**
 * 그림자 품질을 업데이트합니다.
 * @param {string} quality - 품질 수준 ('low', 'medium', 'high')
 * @param {THREE.WebGLRenderer} renderer - Three.js 렌더러
 * @param {Object} lights - 라이트 객체들 {mainLight, spotLight, fillLight, rimLight}
 * @param {THREE.Scene} scene - Three.js 씬
 * @param {THREE.Mesh} floorMesh - 바닥 메시
 * @param {Object} THREE - Three.js 라이브러리
 */
export function updateShadowQuality(quality, renderer, lights, scene, floorMesh, THREE) {
  const { mainLight, spotLight, fillLight, rimLight } = lights;
  const { mapType, mapSize } = getShadowQualitySettings(quality, THREE);

  // 그림자 맵 타입 변경
  renderer.shadowMap.type = mapType;

  // 모든 라이트의 그림자 맵 크기 변경
  updateLightShadowMapSize(mainLight, mapSize);
  updateLightShadowMapSize(spotLight, mapSize);
  updateLightShadowMapSize(fillLight, mapSize);
  updateLightShadowMapSize(rimLight, mapSize);

  // 그림자가 현재 활성화되어 있는 경우에만 재설정
  const shadowToggle = document.getElementById('shadow-toggle');
  if (shadowToggle && shadowToggle.checked) {
    // 그림자를 잠깐 껐다가 다시 켜서 변경사항 즉시 반영
    renderer.shadowMap.enabled = false;

    // 다음 프레임에서 그림자 다시 활성화
    setTimeout(() => {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.needsUpdate = true;

      // 모든 메시의 그림자 설정 재적용
      scene.traverse((obj) => {
        applyShadowToMesh(obj, true, floorMesh);
      });

      // 라이트 그림자 재활성화
      mainLight.castShadow = true;
      if (spotLight) spotLight.castShadow = true;
      if (fillLight) fillLight.castShadow = true;
      if (rimLight) rimLight.castShadow = true;
    }, 10);
  } else {
    // 그림자가 비활성화 상태면 needsUpdate만 설정
    renderer.shadowMap.needsUpdate = true;
  }
}

/**
 * 그림자 컨트롤을 초기화합니다.
 * @param {THREE.WebGLRenderer} renderer - Three.js 렌더러
 * @param {THREE.Scene} scene - Three.js 씬
 * @param {Object} lights - 라이트 객체들 {mainLight, spotLight, fillLight, rimLight}
 * @param {THREE.Mesh} floorMesh - 바닥 메시
 * @param {Object} THREE - Three.js 라이브러리
 */
export function initShadowControls(renderer, scene, lights, floorMesh, THREE) {
  const shadowToggle = document.getElementById('shadow-toggle');
  const shadowQuality = document.getElementById('shadow-quality');

  if (!shadowToggle || !shadowQuality) {
    console.warn('Shadow control elements not found');
    return;
  }

  // 페이지 로드 시 상태 반영
  shadowQuality.classList.toggle('hidden', !shadowToggle.checked);

  // 토글 변경 시 품질 설정 표시/숨김
  shadowToggle.addEventListener('change', (e) => {
    shadowQuality.classList.toggle('hidden', !e.target.checked);
  });

  // 그림자 토글 이벤트
  shadowToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    applyShadowSettings(enabled, scene, renderer, lights, floorMesh);
  });

  // 초기 그림자 비활성화
  shadowToggle.checked = false;
  shadowToggle.dispatchEvent(new Event('change'));

  // 그림자 품질 설정 이벤트 핸들러
  const shadowQualityRadios = document.querySelectorAll('input[name="shadowQuality"]');
  shadowQualityRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      updateShadowQuality(e.target.value, renderer, lights, scene, floorMesh, THREE);
    });
  });
}

/**
 * 셀 호버 시 그림자 설정을 적용합니다.
 * 투명 셀 메시는 항상 그림자를 캐스트하지 않습니다.
 * @param {THREE.Mesh} cell - 셀 메시
 */
export function applyCellHoverShadow(cell) {
  // 투명 셀 메시는 항상 그림자 없음
  cell.castShadow = false;
  cell.receiveShadow = false;
}

/**
 * 셀 호버 해제 시 그림자 설정을 복원합니다.
 * @param {THREE.Mesh} cell - 셀 메시
 */
export function resetCellHoverShadow(cell) {
  // 투명 셀 메시는 항상 그림자 없음
  cell.castShadow = false;
  cell.receiveShadow = false;
}

/**
 * 렌더러의 그림자 설정을 초기화합니다.
 * @param {THREE.WebGLRenderer} renderer - Three.js 렌더러
 * @param {Object} THREE - Three.js 라이브러리
 */
export function initRendererShadows(renderer, THREE) {
  renderer.shadowMap.enabled = false; // 초기에는 그림자 비활성화
  renderer.shadowMap.type = THREE.PCFShadowMap; // 그림자 품질 기본값: 보통
}

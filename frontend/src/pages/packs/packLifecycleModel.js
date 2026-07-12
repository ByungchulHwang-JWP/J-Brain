export const PACK_LIFECYCLE_STEPS = [
  { id: 'build', label: 'Build & Export', description: 'Pack 구성 생성', targetTab: 'build' },
  { id: 'validation', label: 'Validation', description: '품질 검증 통과', targetTab: 'validation' },
  { id: 'repository', label: 'Release & Deploy', description: '배포 및 운영 적용', targetTab: 'repository' },
  { id: 'runtime-test', label: 'Runtime 테스트', description: '위젯과 Simulation 확인', targetPath: '/admin/runtime?tab=chat' },
];

export const formatPackLabel = (pack) => {
  if (!pack?.pack_id) return '미지정';
  return `${pack.pack_id} v${pack.pack_version}`;
};

export const getRuntimePackDeploymentState = (pack, activePack) => {
  const isActive = activePack?.pack_id === pack.pack_id && activePack?.pack_version === pack.pack_version;
  const status = String(pack.status || '').toLowerCase();

  if (isActive || status === 'active') {
    return {
      isActive: true,
      statusLabel: '운영 적용',
      statusClassName: 'active',
      chatAppliedLabel: '적용 중',
      chatClassName: 'active',
      nextAction: '챗봇 위젯과 Runtime Simulation에서 사용 중입니다.',
      allowedActions: { approve: false, reject: false, activate: false },
    };
  }

  if (status === 'approved') {
    return {
      isActive: false,
      statusLabel: '운영 승인',
      statusClassName: 'active',
      chatAppliedLabel: '미적용',
      chatClassName: 'warning',
      nextAction: '"챗봇에 적용"을 실행하면 현재 적용 Pack으로 전환됩니다.',
      allowedActions: { approve: false, reject: true, activate: true },
    };
  }

  if (status === 'validated') {
    return {
      isActive: false,
      statusLabel: 'Runtime 반입',
      statusClassName: 'active',
      chatAppliedLabel: '미적용',
      chatClassName: 'warning',
      nextAction: '운영 승인이 필요합니다. 아직 챗봇에는 적용되지 않았습니다.',
      allowedActions: { approve: true, reject: true, activate: false },
    };
  }

  if (status === 'rejected') {
    return {
      isActive: false,
      statusLabel: '반려',
      statusClassName: 'error',
      chatAppliedLabel: '미적용',
      chatClassName: 'error',
      nextAction: '반려된 Pack입니다. 보완 후 다시 Export/Import해야 합니다.',
      allowedActions: { approve: false, reject: false, activate: false },
    };
  }

  return {
    isActive: false,
    statusLabel: pack.status || '상태 확인 필요',
    statusClassName: 'warning',
    chatAppliedLabel: '미적용',
    chatClassName: 'warning',
    nextAction: '상태 확인이 필요합니다.',
    allowedActions: { approve: false, reject: false, activate: false },
  };
};

export const getPackLifecycleSummary = ({ exports = [], runtimePacks = [], activePack = null }) => {
  const latestExport = exports[0];
  const activeIndex = activePack?.pack_id
    ? runtimePacks.findIndex((pack) => pack.pack_id === activePack.pack_id && pack.pack_version === activePack.pack_version)
    : -1;
  const candidatePacks = activeIndex >= 0 ? runtimePacks.slice(0, activeIndex) : runtimePacks;
  const approvedPendingPack = candidatePacks.find((pack) => pack.status === 'approved');
  const importedPendingPack = candidatePacks.find((pack) => pack.status === 'validated');

  const rollbackLabel = activePack?.previous_pack_id
    ? `${activePack.previous_pack_id} v${activePack.previous_pack_version}`
    : '없음';

  if (approvedPendingPack) {
    return {
      activeLabel: formatPackLabel(activePack),
      rollbackLabel,
      nextActionLabel: `${formatPackLabel(approvedPendingPack)} ➔ Runtime 목록에서 "챗봇에 적용" 클릭`,
      currentStepId: 'repository',
    };
  }

  if (importedPendingPack) {
    return {
      activeLabel: formatPackLabel(activePack),
      rollbackLabel,
      nextActionLabel: `${formatPackLabel(importedPendingPack)} ➔ Runtime 목록에서 "운영 승인" 진행`,
      currentStepId: 'repository',
    };
  }

  if (activePack?.pack_id) {
    return {
      activeLabel: formatPackLabel(activePack),
      rollbackLabel,
      nextActionLabel: `✅ 배포 완료 ➔ 다음 탭에서 "Runtime 테스트" 진행`,
      currentStepId: 'runtime-test',
    };
  }

  if (latestExport) {
    return {
      activeLabel: formatPackLabel(activePack),
      rollbackLabel,
      nextActionLabel: `${latestExport.pack_id} v${latestExport.pack_version} ➔ 산출물 내역에서 "Store 반입" 진행`,
      currentStepId: 'repository',
    };
  }

  return {
    activeLabel: formatPackLabel(activePack),
    rollbackLabel,
    nextActionLabel: 'Pack Build 실행',
    currentStepId: 'build',
  };
};

export const getCompletedStepIds = (currentStepId) => {
  const currentIndex = PACK_LIFECYCLE_STEPS.findIndex((step) => step.id === currentStepId);
  if (currentIndex <= 0) return [];
  return PACK_LIFECYCLE_STEPS.slice(0, currentIndex).map((step) => step.id);
};

/**
 * pack-status API 응답 데이터를 기반으로 각 스텝의 실제 완료 여부를 판단합니다.
 * 기존 getCompletedStepIds는 인덱스 기반 추정이었지만, 이 함수는 DB 데이터 기반으로 정확히 판단합니다.
 */
export const getCompletedStepIdsFromStatus = (statusData) => {
  if (!statusData) return [];
  const completed = [];

  // build: 최소 1건 이상의 Export가 있고 미반영 변경사항이 없을 때
  if (statusData.latest_export && !statusData.has_unexported_changes) {
    completed.push('build');
  }

  // validation: 최근 검증이 통과(passed)되었을 때
  if (statusData.latest_validation?.status === 'passed') {
    completed.push('validation');
  }

  // repository (Release & Deploy): Active Pack이 존재할 때
  // (반입, 승인, 챗봇 적용까지 끝났음을 의미)
  if (statusData.active_pack?.pack_id) {
    completed.push('repository');
  }

  return completed;
};

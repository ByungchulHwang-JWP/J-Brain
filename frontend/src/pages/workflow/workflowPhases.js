export const WORKFLOW_PHASES = [
  {
    stage: 1,
    stage_key: 'project_setup',
    name: '프로젝트 준비',
    description: '프로젝트를 생성하고 기본 식별 정보를 확정합니다.',
    stageNumbers: [1],
  },
  {
    stage: 2,
    stage_key: 'knowledge_ready',
    name: '지식 준비',
    description: 'Source, FAQ, 답변 근거를 수집하고 검색 가능한 지식으로 정리합니다.',
    stageNumbers: [2, 6],
  },
  {
    stage: 3,
    stage_key: 'intent_design',
    name: '의도 설계',
    description: 'Intent, 질문 커버리지, 용어 사전을 함께 설계합니다.',
    stageNumbers: [3, 4, 5],
  },
  {
    stage: 4,
    stage_key: 'action_connection',
    name: '실행 연결',
    description: 'Intent와 화면 이동, 문서 검색, API/Query Action을 연결합니다.',
    stageNumbers: [7],
  },
  {
    stage: 5,
    stage_key: 'pack_validation_build',
    name: 'Pack 검증/빌드',
    description: 'Pack 품질검증, Runtime 시뮬레이션, Pack Build를 수행합니다.',
    stageNumbers: [8, 9, 10],
  },
  {
    stage: 6,
    stage_key: 'deploy_operate',
    name: '배포 및 운영 개선',
    description: '검증된 Pack을 배포/활성화하고 운영 피드백을 다음 개선 사이클로 연결합니다.',
    stageNumbers: [11, 12],
  },
];

export const WORKFLOW_SUBTASKS = {
  1: {
    1: {
      level: '1.1',
      title: '프로젝트 기본 정보',
      description: '챗봇 구축을 시작할 프로젝트 식별 정보와 상태를 확정합니다.',
    },
  },
  2: {
    2: {
      level: '2.1',
      title: 'Source/FAQ 수집',
      description: '문서와 FAQ 원천을 등록하고 검색 가능한 지식으로 준비합니다.',
    },
    6: {
      level: '2.2',
      title: '답변 근거 정리',
      description: 'FAQ와 Source 근거를 연결해 답변에 표시할 출처를 점검합니다.',
    },
  },
  3: {
    3: {
      level: '3.1',
      title: 'Intent 구조 설계',
      description: '사용자 질문 의도와 Action 후보를 Intent 단위로 정리합니다.',
    },
    4: {
      level: '3.2',
      title: '질문 커버리지',
      description: '예상 질문을 보강해 실제 사용자 표현을 커버합니다.',
    },
    5: {
      level: '3.3',
      title: '용어 사전',
      description: '업무 용어와 동의어를 표준화합니다.',
    },
  },
  4: {
    7: {
      level: '4.1',
      title: 'Action 실행 연결',
      description: 'Intent와 화면 이동, 문서 검색, API/Query 실행 방식을 연결합니다.',
    },
  },
  5: {
    8: {
      level: '5.1',
      title: 'Pack 품질검증',
      description: '검증 질문으로 Intent, Action, Confidence 기준을 확인합니다.',
    },
    9: {
      level: '5.2',
      title: 'Runtime 시뮬레이션',
      description: 'Runtime QA에서 실제 질문 응답 흐름을 점검합니다.',
    },
    10: {
      level: '5.3',
      title: 'Pack Build',
      description: '검증된 구성을 배포 가능한 Pack으로 생성합니다.',
    },
  },
  6: {
    11: {
      level: '6.1',
      title: '배포/활성화',
      description: '승인된 Pack을 Runtime Store에 반입하고 Active로 전환합니다.',
    },
    12: {
      level: '6.2',
      title: '운영 분석/개선',
      description: '운영 로그와 미응답을 다음 개선 후보로 연결합니다.',
    },
  },
};

const stageStatusOrder = {
  done: 5,
  warning: 4,
  in_progress: 4,
  waiting: 3,
  locked: 1,
};

const normalizeCount = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export const getPhaseByPhaseNo = (phaseNo) => (
  WORKFLOW_PHASES.find((phase) => Number(phase.stage) === Number(phaseNo)) || WORKFLOW_PHASES[0]
);

export const getPhaseByLegacyStageNo = (stageNo) => (
  WORKFLOW_PHASES.find((phase) => phase.stageNumbers.includes(Number(stageNo))) || WORKFLOW_PHASES[0]
);

export const getPhaseSubtaskMeta = (phaseNo, legacyStageNo) => (
  WORKFLOW_SUBTASKS[Number(phaseNo)]?.[Number(legacyStageNo)] || null
);

const buildPhaseStatus = (childStages, currentLegacyStage) => {
  if (childStages.length === 0) return 'locked';
  if (childStages.every((stage) => stage.status === 'done')) return 'done';
  if (childStages.some((stage) => Number(stage.stage) === Number(currentLegacyStage))) {
    return childStages.some((stage) => stage.status === 'warning') ? 'warning' : 'in_progress';
  }
  if (childStages.some((stage) => stage.status === 'warning')) return 'warning';
  if (childStages.some((stage) => stage.status === 'in_progress')) return 'in_progress';
  if (childStages.some((stage) => stage.can_enter || stage.status === 'waiting')) return 'waiting';
  return 'locked';
};

const buildPhaseChecks = (childStages) => childStages.flatMap((stage) => (
  (stage.checks || []).map((check) => ({
    ...check,
    key: `${stage.stage}_${check.key || check.label}`,
    label: childStages.length > 1 ? `[${stage.name}] ${check.label || check.key}` : check.label,
  }))
));

const pickNextActions = (childStages) => {
  const active = childStages.find((stage) => stage.status !== 'done' && (stage.next_actions || []).length > 0);
  if (active) return active.next_actions;
  return childStages.find((stage) => (stage.next_actions || []).length > 0)?.next_actions || [];
};

export const buildWorkflowPhases = (summary = {}) => {
  const sourceStages = Array.isArray(summary.stages) ? summary.stages : [];
  const currentLegacyStage = normalizeCount(summary.current_stage) || 1;

  return WORKFLOW_PHASES.map((phase) => {
    const childStages = phase.stageNumbers
      .map((stageNo) => sourceStages.find((stage) => Number(stage.stage) === Number(stageNo)))
      .map((stage) => (stage ? {
        ...stage,
        subtask: getPhaseSubtaskMeta(phase.stage, stage.stage),
      } : null))
      .filter(Boolean);
    const status = buildPhaseStatus(childStages, currentLegacyStage);
    const progress = childStages.length === 0
      ? 0
      : Math.round(childStages.reduce((total, stage) => total + normalizeCount(stage.progress), 0) / childStages.length);
    const checks = buildPhaseChecks(childStages);
    const next_actions = pickNextActions(childStages);
    const can_enter = childStages.some((stage) => stage.can_enter || ['done', 'in_progress', 'warning', 'waiting'].includes(stage.status));
    const lockedStage = childStages.find((stage) => stage.locked_reason);
    const primaryStage = childStages.find((stage) => Number(stage.stage) === Number(currentLegacyStage)) || childStages.find((stage) => stage.status !== 'done') || childStages[0];

    return {
      ...phase,
      status,
      progress,
      can_enter,
      locked_reason: lockedStage?.locked_reason || null,
      checks,
      next_actions,
      sourceStages: childStages,
      primaryStage,
      status_weight: stageStatusOrder[status] || 0,
    };
  });
};

import axios from 'axios';

const authHeaders = () => {
  const token = localStorage.getItem('ai_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const workflowBase = '/api/v1/workflow';
const projectPath = (projectId) => `${workflowBase}/projects/${encodeURIComponent(projectId)}`;

export const WORKFLOW_STAGES = [
  { stage: 1, stage_key: 'foundation', name: '기반 설정' },
  { stage: 2, stage_key: 'knowledge', name: '지식 준비' },
  { stage: 3, stage_key: 'intent_design', name: '의도 설계' },
  { stage: 4, stage_key: 'question_coverage', name: '질문 커버리지' },
  { stage: 5, stage_key: 'term_dictionary', name: '용어 사전' },
  { stage: 6, stage_key: 'answer_evidence', name: '답변 근거' },
  { stage: 7, stage_key: 'action_connection', name: '실행 연결' },
  { stage: 8, stage_key: 'pack_validation', name: 'Pack 품질검증' },
  { stage: 9, stage_key: 'runtime_simulation', name: 'Runtime 시뮬레이션' },
  { stage: 10, stage_key: 'pack_build', name: 'Pack Build' },
  { stage: 11, stage_key: 'deploy_activate', name: '배포/활성화' },
  { stage: 12, stage_key: 'ops_improvement', name: '운영 분석/개선' },
];

export const normalizeProject = (project = {}) => ({
  id: project.id || project.project_id || project.code || '',
  name: project.name || project.project_name || project.id || project.project_id || '이름 없음',
  description: project.description || project.summary || '',
  status: project.status || 'active',
  active_pack_version: project.active_pack_version || project.activePackVersion || '-',
  draft_pack_version: project.draft_pack_version || project.draftPackVersion || '-',
  created_at: project.created_at || '',
  updated_at: project.updated_at || project.created_at || '',
});

const normalizeStage = (stage = {}, index = 0) => {
  const fallback = WORKFLOW_STAGES[index] || WORKFLOW_STAGES.find((item) => item.stage === stage.stage) || {};
  const stageNumber = Number(stage.stage || fallback.stage || index + 1);

  return {
    stage: stageNumber,
    stage_key: stage.stage_key || fallback.stage_key || `stage_${stageNumber}`,
    name: stage.name || fallback.name || `${stageNumber}단계`,
    status: stage.status || 'locked',
    progress: Number.isFinite(Number(stage.progress)) ? Number(stage.progress) : 0,
    can_enter: Boolean(stage.can_enter ?? stage.canEnter ?? stage.status !== 'locked'),
    locked_reason: stage.locked_reason || stage.lockedReason || null,
    checks: Array.isArray(stage.checks) ? stage.checks : [],
    next_actions: Array.isArray(stage.next_actions) ? stage.next_actions : [],
  };
};

export const emptyWorkflowSummary = (projectId = '') => ({
  project_id: projectId,
  project_name: projectId || '프로젝트 미선택',
  active_pack_version: '-',
  draft_pack_version: '-',
  current_stage: 1,
  overall_progress: 0,
  blocked_count: 0,
  stages: WORKFLOW_STAGES.map((stage, index) => normalizeStage({ ...stage, status: index === 0 ? 'in_progress' : 'locked', can_enter: index === 0 }, index)),
  next_action: null,
  metrics: {},
});

export const normalizeWorkflowSummary = (summary = {}, projectId = '') => {
  const fallback = emptyWorkflowSummary(projectId || summary.project_id);
  const stages = Array.isArray(summary.stages) && summary.stages.length > 0
    ? summary.stages.map(normalizeStage)
    : fallback.stages;

  return {
    ...fallback,
    ...summary,
    project_id: summary.project_id || projectId || fallback.project_id,
    project_name: summary.project_name || summary.name || projectId || fallback.project_name,
    active_pack_version: summary.active_pack_version || fallback.active_pack_version,
    draft_pack_version: summary.draft_pack_version || fallback.draft_pack_version,
    current_stage: Number(summary.current_stage || fallback.current_stage),
    overall_progress: Number(summary.overall_progress || fallback.overall_progress),
    blocked_count: Number(summary.blocked_count || fallback.blocked_count),
    stages,
    next_action: summary.next_action || null,
    metrics: summary.metrics || {},
  };
};

export const listWorkflowProjects = async () => {
  const res = await axios.get(`${workflowBase}/projects`, { headers: authHeaders() });
  const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
  return data.map(normalizeProject);
};

export const getWorkflowSummary = async (projectId) => {
  const res = await axios.get(`${projectPath(projectId)}/summary`, { headers: authHeaders() });
  return normalizeWorkflowSummary(res.data, projectId);
};

export const getWorkflowStages = async (projectId) => {
  const res = await axios.get(`${projectPath(projectId)}/stages`, { headers: authHeaders() });
  const data = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.stages || [];
  return data.map(normalizeStage);
};

export const getWorkflowNextActions = async (projectId) => {
  const res = await axios.get(`${projectPath(projectId)}/next-actions`, { headers: authHeaders() });
  return Array.isArray(res.data) ? res.data : res.data?.items || [];
};

export const createWorkflowDraftPack = async (projectId, payload = {}) => {
  const res = await axios.post(`${projectPath(projectId)}/draft-packs`, payload, { headers: authHeaders() });
  return res.data;
};

export const postWorkflowStageEvent = async (projectId, payload = {}) => {
  const res = await axios.post(`${projectPath(projectId)}/stage-events`, payload, { headers: authHeaders() });
  return res.data;
};

import axios from 'axios';

const authHeaders = () => {
  const token = localStorage.getItem('ai_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const basePath = (projectId) => `/api/v1/intent-factory/projects/${encodeURIComponent(projectId)}`;
const discoveryBasePath = (projectId) => `/api/v1/intent-discovery/projects/${encodeURIComponent(projectId)}`;

export const listIntents = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/intents`, { headers: authHeaders() });
  return res.data;
};

export const getIntent = async (projectId, intentId) => {
  const res = await axios.get(`${basePath(projectId)}/intents/${encodeURIComponent(intentId)}`, { headers: authHeaders() });
  return res.data;
};

export const createIntent = async (projectId, payload) => {
  const res = await axios.post(`${basePath(projectId)}/intents`, payload, { headers: authHeaders() });
  return res.data;
};

export const updateIntent = async (projectId, intentId, payload) => {
  const res = await axios.put(`${basePath(projectId)}/intents/${encodeURIComponent(intentId)}`, payload, { headers: authHeaders() });
  return res.data;
};

export const archiveIntent = async (projectId, intentId) => {
  const res = await axios.delete(`${basePath(projectId)}/intents/${encodeURIComponent(intentId)}`, { headers: authHeaders() });
  return res.data;
};

export const importIntentPack = async (projectId, payload) => {
  const res = await axios.post(`${basePath(projectId)}/import-pack`, payload, { headers: authHeaders() });
  return res.data;
};

export const listEntities = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/entities`, { headers: authHeaders() });
  return res.data;
};

export const getEntity = async (projectId, entityType) => {
  const res = await axios.get(`${basePath(projectId)}/entities/${encodeURIComponent(entityType)}`, { headers: authHeaders() });
  return res.data;
};

export const createEntity = async (projectId, payload) => {
  const res = await axios.post(`${basePath(projectId)}/entities`, payload, { headers: authHeaders() });
  return res.data;
};

export const updateEntity = async (projectId, entityId, payload) => {
  const res = await axios.put(`${basePath(projectId)}/entities/${encodeURIComponent(entityId)}`, payload, { headers: authHeaders() });
  return res.data;
};

export const archiveEntity = async (projectId, entityId) => {
  const res = await axios.delete(`${basePath(projectId)}/entities/${encodeURIComponent(entityId)}`, { headers: authHeaders() });
  return res.data;
};

export const listActions = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/actions`, { headers: authHeaders() });
  return res.data;
};

export const getAction = async (projectId, actionId) => {
  const res = await axios.get(`${basePath(projectId)}/actions/${encodeURIComponent(actionId)}`, { headers: authHeaders() });
  return res.data;
};

export const createAction = async (projectId, payload) => {
  const res = await axios.post(`${basePath(projectId)}/actions`, payload, { headers: authHeaders() });
  return res.data;
};

export const updateAction = async (projectId, actionId, payload) => {
  const res = await axios.put(`${basePath(projectId)}/actions/${encodeURIComponent(actionId)}`, payload, { headers: authHeaders() });
  return res.data;
};

export const archiveAction = async (projectId, actionId) => {
  const res = await axios.delete(`${basePath(projectId)}/actions/${encodeURIComponent(actionId)}`, { headers: authHeaders() });
  return res.data;
};

export const listFaqs = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/faqs`, { headers: authHeaders() });
  return res.data;
};

export const getFaq = async (projectId, faqId) => {
  const res = await axios.get(`${basePath(projectId)}/faqs/${encodeURIComponent(faqId)}`, { headers: authHeaders() });
  return res.data;
};

export const createFaq = async (projectId, payload) => {
  const res = await axios.post(`${basePath(projectId)}/faqs`, payload, { headers: authHeaders() });
  return res.data;
};

export const updateFaq = async (projectId, faqId, payload) => {
  const res = await axios.put(`${basePath(projectId)}/faqs/${encodeURIComponent(faqId)}`, payload, { headers: authHeaders() });
  return res.data;
};

export const archiveFaq = async (projectId, faqId) => {
  const res = await axios.delete(`${basePath(projectId)}/faqs/${encodeURIComponent(faqId)}`, { headers: authHeaders() });
  return res.data;
};

export const listFaqCandidates = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/faq-candidates`, { headers: authHeaders() });
  return res.data;
};

export const listUnansweredLogs = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/unanswered-logs`, { headers: authHeaders() });
  return res.data;
};

export const convertUnansweredToFaqCandidate = async (projectId, logId, payload = {}) => {
  const res = await axios.post(
    `${basePath(projectId)}/unanswered-logs/${encodeURIComponent(logId)}/faq-candidate`,
    payload,
    { headers: authHeaders() },
  );
  return res.data;
};

export const getIntentEntities = async (projectId, intentId) => {
  const res = await axios.get(`${basePath(projectId)}/intents/${encodeURIComponent(intentId)}/entities`, { headers: authHeaders() });
  return res.data;
};

export const updateIntentEntities = async (projectId, intentId, payload) => {
  const res = await axios.put(`${basePath(projectId)}/intents/${encodeURIComponent(intentId)}/entities`, payload, { headers: authHeaders() });
  return res.data;
};

export const getPackDraft = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/pack-draft`, { headers: authHeaders() });
  return res.data;
};

export const listValidationQuestions = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/validation-questions`, { headers: authHeaders() });
  return res.data;
};

export const createValidationQuestion = async (projectId, payload) => {
  const res = await axios.post(`${basePath(projectId)}/validation-questions`, payload, { headers: authHeaders() });
  return res.data;
};

export const updateValidationQuestion = async (projectId, questionId, payload) => {
  const res = await axios.put(`${basePath(projectId)}/validation-questions/${encodeURIComponent(questionId)}`, payload, { headers: authHeaders() });
  return res.data;
};

export const archiveValidationQuestion = async (projectId, questionId) => {
  const res = await axios.delete(`${basePath(projectId)}/validation-questions/${encodeURIComponent(questionId)}`, { headers: authHeaders() });
  return res.data;
};

export const runPackValidation = async (projectId, payload) => {
  const res = await axios.post(`${basePath(projectId)}/pack-validation-runs`, payload, { headers: authHeaders() });
  return res.data;
};

export const listPackValidationResults = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/pack-validation-results`, { headers: authHeaders() });
  return res.data;
};

export const listPackExports = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/pack-exports`, { headers: authHeaders() });
  return res.data;
};

export const createPackExport = async (projectId, payload = {}) => {
  const res = await axios.post(`${basePath(projectId)}/pack-exports`, payload, { headers: authHeaders() });
  return res.data;
};

export const getPackExportDownloadUrl = (projectId, exportId) => (
  `${basePath(projectId)}/pack-exports/${encodeURIComponent(exportId)}/download`
);

export const importPackExport = async (projectId, exportId) => {
  const res = await axios.post(`${basePath(projectId)}/pack-exports/${encodeURIComponent(exportId)}/import`, {}, { headers: authHeaders() });
  return res.data;
};

export const listRuntimePacks = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/runtime-packs`, { headers: authHeaders() });
  return res.data;
};

export const getActivePack = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/active-pack`, { headers: authHeaders() });
  return res.data;
};

export const activateRuntimePack = async (projectId, payload) => {
  const res = await axios.post(`${basePath(projectId)}/active-pack`, payload, { headers: authHeaders() });
  return res.data;
};

export const approveRuntimePack = async (projectId, packId, packVersion, payload = {}) => {
  const res = await axios.post(`${basePath(projectId)}/runtime-packs/${encodeURIComponent(packId)}/${encodeURIComponent(packVersion)}/approve`, payload, { headers: authHeaders() });
  return res.data;
};

export const rejectRuntimePack = async (projectId, packId, packVersion, payload = {}) => {
  const res = await axios.post(`${basePath(projectId)}/runtime-packs/${encodeURIComponent(packId)}/${encodeURIComponent(packVersion)}/reject`, payload, { headers: authHeaders() });
  return res.data;
};

export const rollbackActivePack = async (projectId) => {
  const res = await axios.post(`${basePath(projectId)}/active-pack/rollback`, {}, { headers: authHeaders() });
  return res.data;
};

export const listPackAuditLogs = async (projectId) => {
  const res = await axios.get(`${basePath(projectId)}/pack-audit-logs`, { headers: authHeaders() });
  return res.data;
};

export const createDiscoveryRun = async (projectId, scope = 'all') => {
  const res = await axios.post(`${discoveryBasePath(projectId)}/runs`, { scope }, { headers: authHeaders() });
  return res.data;
};

export const listDiscoveryRuns = async (projectId) => {
  const res = await axios.get(`${discoveryBasePath(projectId)}/runs`, { headers: authHeaders() });
  return res.data;
};

export const listDiscoveryCandidates = async (projectId) => {
  const res = await axios.get(`${discoveryBasePath(projectId)}/candidates`, { headers: authHeaders() });
  return res.data;
};

export const updateDiscoveryCandidateStatus = async (projectId, candidateId, status) => {
  const res = await axios.patch(
    `${discoveryBasePath(projectId)}/candidates/${encodeURIComponent(candidateId)}`,
    { status },
    { headers: authHeaders() },
  );
  return res.data;
};

export const applyApprovedDiscoveryCandidates = async (projectId) => {
  const res = await axios.post(`${discoveryBasePath(projectId)}/apply-approved`, {}, { headers: authHeaders() });
  return res.data;
};

export const getDiscoverySummary = async (projectId) => {
  const res = await axios.get(`${discoveryBasePath(projectId)}/summary`, { headers: authHeaders() });
  return res.data;
};

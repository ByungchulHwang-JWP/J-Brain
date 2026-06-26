import axios from 'axios';

const authHeaders = () => {
  const token = localStorage.getItem('ai_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const basePath = (projectId) => `/api/v1/intent-factory/projects/${encodeURIComponent(projectId)}`;

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

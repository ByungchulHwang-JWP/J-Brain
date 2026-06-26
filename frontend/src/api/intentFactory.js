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

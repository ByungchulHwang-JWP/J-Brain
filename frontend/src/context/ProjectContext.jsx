import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const ProjectContext = createContext(null);

const PROJECT_STORAGE_KEY = 'jbrain-selected-project-id';
const LEGACY_WORKFLOW_PROJECT_KEY = 'jbrain-workflow-project-id';

const getInitialProjectId = () => (
  localStorage.getItem(PROJECT_STORAGE_KEY)
  || localStorage.getItem(LEGACY_WORKFLOW_PROJECT_KEY)
  || ''
);

const getProjectId = (project) => project?.id || project?.project_id || project?.domain || '';

const persistProjectId = (projectId) => {
  if (!projectId) {
    localStorage.removeItem(PROJECT_STORAGE_KEY);
    localStorage.removeItem(LEGACY_WORKFLOW_PROJECT_KEY);
    return;
  }

  localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
  localStorage.setItem(LEGACY_WORKFLOW_PROJECT_KEY, projectId);
};

export const ProjectProvider = ({ children }) => {
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectIdState] = useState(getInitialProjectId);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectLoadError, setProjectLoadError] = useState(null);

  const setSelectedProjectId = useCallback((projectId) => {
    setSelectedProjectIdState(projectId || '');
    persistProjectId(projectId || '');
  }, []);

  const refreshProjects = useCallback(async () => {
    const token = localStorage.getItem('ai_access_token');
    if (!token) {
      setProjects([]);
      return [];
    }

    setLoadingProjects(true);
    setProjectLoadError(null);

    try {
      const res = await axios.get('/api/v1/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const loadedProjects = Array.isArray(res.data) ? res.data : [];
      const availableIds = new Set(loadedProjects.map(getProjectId).filter(Boolean));

      setProjects(loadedProjects);
      setSelectedProjectIdState((currentProjectId) => {
        const preferredProjectId = currentProjectId || getInitialProjectId();
        const nextProjectId = availableIds.has(preferredProjectId)
          ? preferredProjectId
          : getProjectId(loadedProjects[0]);

        persistProjectId(nextProjectId);
        return nextProjectId;
      });

      return loadedProjects;
    } catch (err) {
      const status = err?.response?.status;
      if (status !== 401 && status !== 403) {
        console.error('프로젝트 목록 조회 실패:', err);
      }
      setProjectLoadError(err);
      setProjects([]);
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('ai_access_token'));
    if (!hasToken) {
      setProjects([]);
      setProjectLoadError(null);
      return;
    }

    if (location.pathname.startsWith('/admin') && projects.length === 0 && !loadingProjects) {
      refreshProjects();
    }
  }, [location.pathname, loadingProjects, projects.length, refreshProjects]);

  const selectedProject = useMemo(
    () => projects.find((project) => getProjectId(project) === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const value = useMemo(() => ({
    projects,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    loadingProjects,
    projectLoadError,
    refreshProjects,
  }), [
    projects,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    loadingProjects,
    projectLoadError,
    refreshProjects,
  ]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

export const projectContextStorageKeys = {
  current: PROJECT_STORAGE_KEY,
  legacyWorkflow: LEGACY_WORKFLOW_PROJECT_KEY,
};

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listWorkflowProjects } from '../../api/workflow';

const WorkflowEntry = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const routeToWorkflow = async () => {
      try {
        const projects = await listWorkflowProjects();
        const savedProjectId = localStorage.getItem('jbrain-workflow-project-id');
        const selected = projects.find((project) => project.id === savedProjectId) || projects[0];

        if (selected?.id) {
          localStorage.setItem('jbrain-workflow-project-id', selected.id);
          navigate(`/admin/workflow/projects/${encodeURIComponent(selected.id)}`, { replace: true });
          return;
        }
      } catch (error) {
        console.error('워크플로우 기본 프로젝트 확인 실패:', error);
      }
      navigate('/admin/workflow/projects', { replace: true });
    };

    routeToWorkflow();
  }, [navigate]);

  return (
    <div className="inner workflow-page">
      <div className="workflow-empty-state">구축 워크플로우 대시보드로 이동하고 있습니다.</div>
    </div>
  );
};

export default WorkflowEntry;


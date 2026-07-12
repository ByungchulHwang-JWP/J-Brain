import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useProjectContext } from '../../context/ProjectContext';
import PackBuilder from './PackBuilder';
import PackValidation from './PackValidation';
import PackRepository from './PackRepository';
import PackLifecycleStepper from './PackLifecycleStepper';
import PackLifecycleSummary from './PackLifecycleSummary';
import { getCompletedStepIds } from './packLifecycleModel';

const tabToStep = {
  build: 'build',
  validation: 'validation',
  repository: 'runtime-import',
};

const tabSummary = {
  build: {
    nextActionLabel: 'Pack Build 실행',
    activeLabel: 'Repository 단계에서 확인',
    rollbackLabel: 'Repository 단계에서 확인',
    currentStepId: 'build',
  },
  validation: {
    nextActionLabel: 'Validation 실행 및 통과 확인',
    activeLabel: 'Repository 단계에서 확인',
    rollbackLabel: 'Repository 단계에서 확인',
    currentStepId: 'validation',
  },
};

const PackLifecycleConsole = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedProjectId } = useProjectContext();
  const routeProjectId = searchParams.get('projectId') || searchParams.get('project');
  const projectId = routeProjectId || selectedProjectId;

  const [repositorySummary, setRepositorySummary] = useState(null);
  const [hasUnexportedChanges, setHasUnexportedChanges] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`/api/v1/projects/${encodeURIComponent(projectId)}/pack-status`);
        if (res.data?.has_unexported_changes) {
          setHasUnexportedChanges(true);
          if (!searchParams.has('tab') || searchParams.get('tab') !== 'build') {
            const next = new URLSearchParams(searchParams);
            next.set('tab', 'build');
            next.delete('step');
            setSearchParams(next, { replace: true });
          }
        } else {
          setHasUnexportedChanges(false);
        }
      } catch (err) {
        console.error('Failed to fetch pack status', err);
      }
    };
    fetchStatus();
  }, [projectId, searchParams]);

  const hasExplicitNavigation = searchParams.has('tab') || searchParams.has('step');
  const activeTab = searchParams.get('tab') || (hasUnexportedChanges ? 'build' : 'repository');
  const selectedStep = searchParams.get('step');
  const currentStepId = selectedStep
    || (!hasExplicitNavigation && activeTab === 'repository' ? repositorySummary?.currentStepId : null)
    || tabToStep[activeTab]
    || 'runtime-import';

  const selectStep = (step) => {
    if (step.targetPath) {
      navigate(step.targetPath);
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('tab', step.targetTab);
    if (step.targetTab === 'repository') {
      next.set('step', step.id);
    } else {
      next.delete('step');
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="inner pack-lifecycle-shell">
      <div className="breadcrumb">
        <span>Pack 제작/배포</span> {'>'} <span>Pack 생명주기 콘솔</span>
      </div>
      <div className="page-header" style={{ padding: '12px 0 8px', margin: 0 }}>
        <h2 style={{ fontWeight: 700 }}>Pack 생명주기 콘솔</h2>
        <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>
          Build부터 Runtime 테스트까지 하나의 Pack 적용 워크플로우로 관리합니다.
        </p>
      </div>

      <PackLifecycleStepper
        currentStepId={currentStepId}
        completedStepIds={getCompletedStepIds(currentStepId)}
        onStepSelect={selectStep}
      />

      {hasUnexportedChanges && activeTab === 'build' && (
        <div style={{
          background: 'rgba(255, 171, 0, 0.1)',
          border: '1px solid var(--color-warning)',
          borderRadius: '8px',
          padding: '12px 16px',
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--color-warning)'
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            Intent 설계에 미반영 변경 사항이 감지되었습니다. 최신 상태를 챗봇에 적용하려면 새로운 Pack을 빌드해 주세요.
          </span>
        </div>
      )}

      {activeTab === 'build' && (
        <>
          <PackLifecycleSummary summary={tabSummary.build} validationLabel="Build 단계" />
          <PackBuilder embedded />
        </>
      )}
      {activeTab === 'validation' && (
        <>
          <PackLifecycleSummary summary={tabSummary.validation} validationLabel="Validation 단계" />
          <PackValidation embedded />
        </>
      )}
      {activeTab === 'repository' && (
        <PackRepository
          embedded
          onLifecycleSummaryChange={setRepositorySummary}
        />
      )}
    </div>
  );
};

export default PackLifecycleConsole;

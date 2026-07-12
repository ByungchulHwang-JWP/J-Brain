import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useProjectContext } from '../../context/ProjectContext';
import PackBuilder from './PackBuilder';
import PackValidation from './PackValidation';
import PackRepository from './PackRepository';
import PackLifecycleStepper from './PackLifecycleStepper';
import PackLifecycleSummary from './PackLifecycleSummary';
import { getCompletedStepIdsFromStatus } from './packLifecycleModel';

const tabToStep = {
  build: 'build',
  validation: 'validation',
  repository: 'repository',
};

const formatPackLabel = (pack) => {
  if (!pack?.pack_id) return '미지정';
  return `${pack.pack_id} v${pack.pack_version}`;
};

const PackLifecycleConsole = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedProjectId } = useProjectContext();
  const routeProjectId = searchParams.get('projectId') || searchParams.get('project');
  const projectId = routeProjectId || selectedProjectId;

  const [repositorySummary, setRepositorySummary] = useState(null);
  const [hasUnexportedChanges, setHasUnexportedChanges] = useState(false);
  const [packStatus, setPackStatus] = useState(null);

  const fetchPackStatus = async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(`/api/v1/projects/${encodeURIComponent(projectId)}/pack-status`);
      const data = res.data;
      setPackStatus(data);
      if (data?.has_unexported_changes) {
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

  useEffect(() => {
    fetchPackStatus();
  }, [projectId]);

  const activeTab = searchParams.get('tab') || (hasUnexportedChanges ? 'build' : 'repository');
  const currentStepId = tabToStep[activeTab] || 'repository';

  const selectStep = (step) => {
    if (step.targetPath) {
      navigate(step.targetPath);
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('tab', step.targetTab);
    setSearchParams(next, { replace: true });
  };

  const handleBuildComplete = (result) => {
    setHasUnexportedChanges(false);
    fetchPackStatus();
  };

  // -- 동적 Summary 생성 --
  const activePackLabel = packStatus?.active_pack ? formatPackLabel(packStatus.active_pack) : '미지정';
  const rollbackLabel = packStatus?.active_pack?.previous_pack_id
    ? `${packStatus.active_pack.previous_pack_id} v${packStatus.active_pack.previous_pack_version}`
    : '없음';

  const buildSummary = (() => {
    let nextActionLabel = 'Pack Build 실행';
    let validationLabel = '빌드 이력 없음';

    if (hasUnexportedChanges) {
      nextActionLabel = '최신 변경사항 반영 빌드 필요';
    } else if (packStatus?.latest_export) {
      nextActionLabel = `빌드 완료 — Validation 진행`;
    }

    if (packStatus?.latest_export) {
      validationLabel = `v${packStatus.latest_export.pack_version} / ${packStatus.latest_export.status}`;
    }

    return {
      nextActionLabel,
      activeLabel: activePackLabel,
      rollbackLabel,
      currentStepId: 'build',
      validationLabel,
    };
  })();

  const validationSummary = (() => {
    let nextActionLabel = '검증 실행 필요';
    let validationLabel = '검증 이력 없음';

    if (packStatus?.latest_validation?.status === 'passed') {
      nextActionLabel = 'Validation 통과 — Repository 이동';
    } else if (packStatus?.latest_validation) {
      nextActionLabel = `최근 검증: ${packStatus.latest_validation.status}`;
    }

    if (packStatus?.latest_validation) {
      validationLabel = `${packStatus.latest_validation.status} / v${packStatus.latest_validation.pack_version}`;
    }

    return {
      nextActionLabel,
      activeLabel: activePackLabel,
      rollbackLabel,
      currentStepId: 'validation',
      validationLabel,
    };
  })();

  const latestValidationPassed = packStatus?.latest_validation?.status === 'passed';

  // -- 스텝퍼 완료 상태 계산 --
  const completedStepIds = packStatus
    ? getCompletedStepIdsFromStatus(packStatus)
    : [];

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
        completedStepIds={completedStepIds}
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
          <PackLifecycleSummary summary={buildSummary} validationLabel={buildSummary.validationLabel} />
          <PackBuilder embedded onBuildComplete={handleBuildComplete} />
          
          {!hasUnexportedChanges && (
            <div style={{ textAlign: 'right', marginTop: '20px', paddingBottom: '20px' }}>
              <button
                className="btn-primary"
                style={{ fontSize: '15px', padding: '12px 24px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('tab', 'validation');
                  next.delete('step');
                  setSearchParams(next, { replace: true });
                }}
              >
                다음 단계 (Validation) 진행하기
                <span style={{ fontSize: '18px' }}>➔</span>
              </button>
            </div>
          )}
        </>
      )}
      {activeTab === 'validation' && (
        <>
          <PackLifecycleSummary summary={validationSummary} validationLabel={validationSummary.validationLabel} />
          <PackValidation embedded onValidationComplete={fetchPackStatus} />

          {latestValidationPassed && (
            <div style={{ textAlign: 'right', marginTop: '20px', paddingBottom: '20px' }}>
              <button
                className="btn-primary"
                style={{ fontSize: '15px', padding: '12px 24px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('tab', 'repository');
                  setSearchParams(next, { replace: true });
                }}
              >
                다음 단계 (Release & Deploy) 진행하기
                <span style={{ fontSize: '18px' }}>➔</span>
              </button>
            </div>
          )}
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

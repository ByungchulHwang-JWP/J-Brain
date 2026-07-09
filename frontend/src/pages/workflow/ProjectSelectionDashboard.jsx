import { Spinner } from '../../components/common/Loader';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listWorkflowProjects } from '../../api/workflow';

const ProjectSelectionDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setProjects(await listWorkflowProjects());
      } catch (err) {
        console.error(err);
        setError('프로젝트 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return projects;
    return projects.filter((project) => (
      `${project.id} ${project.name} ${project.description}`.toLowerCase().includes(keyword)
    ));
  }, [projects, query]);

  return (
    <div className="inner workflow-page">
      <div className="breadcrumb">
        <span>구축 워크플로우</span> {'>'} <span>프로젝트 선택</span>
      </div>

      <div className="workflow-header">
        <div>
          <h2>프로젝트 목록/선택</h2>
          <p>챗봇 구축을 진행할 프로젝트를 선택하면 6단계 구축 워크플로우로 이동합니다.</p>
        </div>
        <button className="btn-primary" type="button" onClick={() => navigate('/admin/projects')}>프로젝트 관리</button>
      </div>

      {notice && (
        <div className="workflow-message">
          {notice}
          <button className="workflow-message-close" type="button" onClick={() => setNotice('')}>닫기</button>
        </div>
      )}

      <div className="filter-bar">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="프로젝트명, ID, 설명 검색"
          style={{ minWidth: 320 }}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="workflow-project-grid">
        {loading ? (
          <div className="workflow-empty-state" style={{display:'flex', flexDirection:'column', alignItems:'center'}}><Spinner size={32} color="var(--color-primary)" style={{marginBottom: 16}} />프로젝트 목록을 확인하고 있습니다.</div>
        ) : filtered.length === 0 ? (
          <div className="workflow-empty-state">
            <strong>아직 생성된 프로젝트가 없습니다.</strong>
            <p>프로젝트 관리에서 신규 프로젝트를 생성한 뒤 구축 워크플로우를 시작해 주세요.</p>
            <button className="btn-primary" type="button" onClick={() => navigate('/admin/projects')}>
              프로젝트 생성하러 가기
            </button>
          </div>
        ) : (
          filtered.map((project) => (
            <section className="workflow-project-card" key={project.id}>
              <div className="workflow-project-main">
                <span className="badge active">{project.status === 'active' ? '활성' : project.status}</span>
                <h3>{project.name}</h3>
                <p>{project.description || '프로젝트 설명이 없습니다.'}</p>
              </div>
              <dl className="workflow-project-meta">
                <div><dt>Project ID</dt><dd>{project.id}</dd></div>
                <div><dt>Active Pack</dt><dd>{project.active_pack_version || '-'}</dd></div>
                <div><dt>최근 생성일</dt><dd>{project.created_at || '-'}</dd></div>
              </dl>
              <div className="workflow-project-actions">
                <button className="btn-secondary" type="button" onClick={() => navigate(`/admin/projects/${project.id}`)}>정보 관리</button>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => {
                    localStorage.setItem('jbrain-workflow-project-id', project.id);
                    navigate(`/admin/workflow/projects/${encodeURIComponent(project.id)}`);
                  }}
                >
                  워크플로우 시작
                </button>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectSelectionDashboard;

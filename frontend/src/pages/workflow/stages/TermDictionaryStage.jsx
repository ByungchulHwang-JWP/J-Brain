import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Braces, CheckCircle2, Languages, ListChecks, PlusCircle, ShieldCheck } from 'lucide-react';
import { listEntities } from '../../../api/intentFactory';

const valueTypeLabel = {
  string: '문자',
  code: '코드',
  enum: '선택값',
  date_range: '기간',
  number: '숫자',
};

const TermDictionaryStage = ({ projectId, stage, summary }) => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const data = await listEntities(projectId);
        setEntities(data.items || []);
      } catch (err) {
        console.error(err);
        setEntities([]);
        setMessage('Entity/Synonym 목록을 불러오지 못했습니다. 워크플로우 집계 기준으로 표시합니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const activeEntities = entities.filter((entity) => entity.status !== 'archived');
  const synonymTotal = activeEntities.reduce((sum, entity) => sum + Number(entity.synonym_count || 0), 0);
  const missingSynonym = activeEntities.filter((entity) => Number(entity.synonym_count || 0) === 0);
  const requiredValidation = activeEntities.filter((entity) => entity.required_validation);
  const codeLikeEntities = activeEntities.filter((entity) => ['code', 'enum'].includes(entity.value_type));

  const dictionaryGuides = [
    {
      icon: Braces,
      title: '업무 파라미터 정의',
      description: '공장, 현장, Scope, 기간처럼 질문에서 추출해야 할 값을 Entity로 정의합니다.',
      examples: ['factory', 'site', 'scope', 'period'],
    },
    {
      icon: Languages,
      title: '표준어/동의어 연결',
      description: '현장 표현과 표준 명칭을 canonical value 기준으로 묶어 매칭 품질을 높입니다.',
      examples: ['A공장 = 에이공장', 'Scope1 = 스코프1'],
    },
    {
      icon: ShieldCheck,
      title: '값 검증 기준 설정',
      description: '코드값, enum, 숫자 범위처럼 잘못된 입력을 막아야 하는 Entity를 표시합니다.',
      examples: ['enum', 'code', 'number'],
    },
  ];

  const readiness = [
    { label: 'Entity 정의', done: activeEntities.length > 0, meta: `${activeEntities.length || summary.metrics.entity_count || 0}건` },
    { label: 'Synonym 등록', done: synonymTotal > 0, meta: `${synonymTotal || summary.metrics.synonym_count || 0}건` },
    { label: '검증 필요 항목', done: requiredValidation.length > 0 || activeEntities.length > 0, meta: `${requiredValidation.length}건` },
    { label: '표준화 후보 정리', done: missingSynonym.length === 0 && activeEntities.length > 0, meta: missingSynonym.length === 0 ? '충족' : `${missingSynonym.length}건 필요` },
  ];

  const tableItems = useMemo(() => {
    if (missingSynonym.length > 0) return missingSynonym;
    return activeEntities.slice(0, 8);
  }, [activeEntities, missingSynonym]);

  return (
    <section className="workflow-term-stage">
      <div className="workflow-term-hero panel">
        <div>
          <span className="workflow-pill blue">3단계 의도 설계</span>
          <h3>Entity/Synonym 표준화</h3>
          <p>
            업무 용어, 현장 표현, 코드값을 정리해 Intent 매칭과 Entity 추출 품질을 높입니다.
            이 단계에서 정의한 사전은 Pack Export 시 NLU 구성 요소로 반영됩니다.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => navigate('/admin/intent-factory/entities')}>
          <PlusCircle size={16} /> Entity 등록
        </button>
      </div>

      {message && <div className="workflow-message">{message}</div>}

      <div className="workflow-knowledge-metrics">
        <div className="panel workflow-status-card"><span>Entity</span><strong>{activeEntities.length || summary.metrics.entity_count || 0}건</strong><small>업무 파라미터</small></div>
        <div className="panel workflow-status-card"><span>Synonym</span><strong>{synonymTotal || summary.metrics.synonym_count || 0}건</strong><small>표준어 연결</small></div>
        <div className="panel workflow-status-card"><span>검증 필요</span><strong>{requiredValidation.length}건</strong><small>값 검증 대상</small></div>
        <div className="panel workflow-status-card"><span>코드형 Entity</span><strong>{codeLikeEntities.length}건</strong><small>code/enum 기준</small></div>
      </div>

      <div className="workflow-knowledge-grid">
        <div className="panel workflow-stage-worklist">
          <div className="workflow-board-head">
            <div>
              <h3>용어 사전 설계 가이드</h3>
              <p>운영자가 Entity/Synonym을 정리할 때 확인해야 할 기준입니다.</p>
            </div>
            <span className="workflow-pill amber">표준화 단계</span>
          </div>
          <div className="workflow-work-card-grid three">
            {dictionaryGuides.map((card) => {
              const Icon = card.icon;
              return (
                <div className="workflow-work-card" key={card.title}>
                  <span className="workflow-work-icon"><Icon size={18} /></span>
                  <strong>{card.title}</strong>
                  <p>{card.description}</p>
                  <div className="workflow-example-chips">
                    {card.examples.map((example) => <span key={example}>{example}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="panel workflow-status-card">
          <div className="workflow-section-title"><span>완료 조건 요약</span></div>
          <div className="workflow-foundation-checks">
            {readiness.map((item) => (
              <div className="workflow-foundation-check" key={item.label}>
                <span className={`workflow-dot ${item.done ? 'done' : 'todo'}`}>{item.done ? '✓' : '!'}</span>
                <div><strong>{item.label}</strong><small>{item.meta}</small></div>
              </div>
            ))}
          </div>
          <div className="workflow-inline-note">
            {stage?.locked_reason || '용어 사전이 정리되면 2단계 지식 준비의 FAQ와 Source 근거 품질을 함께 보강합니다.'}
          </div>
        </aside>
      </div>

      <div className="panel workflow-intent-board">
        <div className="workflow-board-head">
          <div>
            <h3>{missingSynonym.length > 0 ? '표준화 필요 Entity' : 'Entity 사전 현황'}</h3>
            <p>Synonym이 없거나 검증 기준을 정리해야 하는 Entity를 우선 확인합니다.</p>
          </div>
          <ListChecks size={20} />
        </div>
        <div className="workflow-table-card">
          <table>
            <thead><tr><th>Entity Type</th><th>표시명</th><th>Value Type</th><th>Synonym</th><th>검증</th><th>상태</th><th>관리</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7">Entity 목록을 불러오는 중입니다.</td></tr>
              ) : tableItems.length === 0 ? (
                <tr><td colSpan="7">등록된 Entity가 없습니다. Entity 등록부터 진행해 주세요.</td></tr>
              ) : tableItems.map((entity) => (
                <tr key={entity.entity_type}>
                  <td><div className="name mono">{entity.entity_type}</div></td>
                  <td><div className="name">{entity.display_name}</div><div className="meta">{entity.description || '-'}</div></td>
                  <td>{valueTypeLabel[entity.value_type] || entity.value_type}</td>
                  <td>{entity.synonym_count || 0}건</td>
                  <td>{entity.required_validation ? <span className="badge warning">필요</span> : '-'}</td>
                  <td>{entity.status || '-'}</td>
                  <td><button className="btn-table" type="button" onClick={() => navigate('/admin/intent-factory/entities')}>수정</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </section>
  );
};

export default TermDictionaryStage;

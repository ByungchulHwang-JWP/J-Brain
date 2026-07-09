import toast from 'react-hot-toast';
import { Skeleton, Spinner } from '../components/common/Loader';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { isAuthError } from '../api/httpClient';

const SourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  const [source, setSource] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [entities, setEntities] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const token = () => localStorage.getItem('ai_access_token');

  // 기본 정보 로드
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`/api/v1/sources/${id}`, {
          headers: { Authorization: `Bearer ${token()}` }
        });
        setSource(res.data);
      } catch (err) {
        console.error(err);
        if (isAuthError(err)) {
          toast.error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
          return;
        }
        toast.error('문서 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // 탭 전환 시 데이터 로드
  useEffect(() => {
    const fetchTabData = async () => {
      if (activeTab === 'info') return;
      setTabLoading(true);
      try {
        if (activeTab === 'chunk' && chunks.length === 0) {
          const res = await axios.get(`/api/v1/sources/${id}/chunks`, {
            headers: { Authorization: `Bearer ${token()}` }
          });
          setChunks(res.data);
        }
        if (activeTab === 'entity' && entities.length === 0) {
          const res = await axios.get(`/api/v1/sources/${id}/entities`, {
            headers: { Authorization: `Bearer ${token()}` }
          });
          setEntities(res.data);
        }
        if (activeTab === 'job' && jobs.length === 0) {
          const res = await axios.get(`/api/v1/sources/${id}/jobs`, {
            headers: { Authorization: `Bearer ${token()}` }
          });
          setJobs(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab, id]);

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/v1/sources/${id}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      navigate('/admin/sources');
    } catch (err) {
      if (isAuthError(err)) {
        toast.error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
        return;
      }
      toast.error('삭제에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
  };

  const tabStyle = (tab) => ({
    padding: '12px 24px', cursor: 'pointer',
    borderBottom: activeTab === tab ? '2px solid #031B4B' : 'none',
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? '#031B4B' : '#666'
  });

  const statusBadge = (status) => {
    if (!status) return 'warning';
    const s = status.toLowerCase();
    if (s === 'success') return 'active';
    if (s === 'error' || s === 'failed') return 'error';
    return 'warning';
  };

  if (loading) {
    return <div className="inner" style={{ textAlign: 'center', padding: '60px', color: '#888' }}><Spinner size={32} color="var(--color-primary)" /><p style={{marginTop: 16}}>문서 정보를 불러오는 중입니다...</p></div>;
  }

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>Source 관리</span> {'>'}
        <span onClick={() => navigate('/admin/sources')} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#3069B3' }}> Source 목록</span> {'>'}
        <span> Source 상세</span>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>{source?.filename || id} 상세</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => navigate(`/admin/sources/${id}/preview`)}>Graph Preview</button>
          <button
            style={{ padding: '8px 20px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', background: '#fff', border: '1px solid #dc3545', color: '#dc3545' }}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            삭제
          </button>
          <button className="btn-primary" onClick={() => navigate('/admin/sources')}>목록으로</button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '24px' }}>
        <div onClick={() => setActiveTab('info')} style={tabStyle('info')}>기본 정보</div>
        <div onClick={() => setActiveTab('chunk')} style={tabStyle('chunk')}>
          문서 & Chunk 목록 {source?.chunk_count > 0 && <span style={{ marginLeft: '6px', background: '#EEF4FF', color: '#3069B3', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>{source.chunk_count}</span>}
        </div>
        <div onClick={() => setActiveTab('entity')} style={tabStyle('entity')}>Entity & Relation</div>
        <div onClick={() => setActiveTab('job')} style={tabStyle('job')}>IndexJob 이력</div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '32px' }}>

        {/* ─── 기본 정보 탭 ─── */}
        {activeTab === 'info' && source && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '40px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>도메인 (프로젝트)</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{source.category || '-'}</div>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>Source 유형</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{source.file_type}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '40px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>파일명</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{source.filename}</div>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>용량</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{source.size}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '40px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>상태</h4>
                <span className={`badge ${statusBadge(source.status)}`}>{source.status}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>Chunk 수</h4>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{source.chunk_count}개</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: '24px' }}>
              <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '14px' }}>등록일시</h4>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>{source.created_at}</div>
            </div>
          </div>
        )}

        {/* ─── Chunk 탭 ─── */}
        {activeTab === 'chunk' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
              Text Chunks ({tabLoading ? <Spinner size={14} /> : `${chunks.length}개`})
            </h3>
            {tabLoading ? (
              <div style={{ padding: '20px' }}>{Array.from({length: 3}).map((_, i) => <div style={{marginBottom: 16}} key={i}><Skeleton height="80px" /></div>)}</div>
            ) : chunks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>청크 데이터가 없습니다.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                {chunks.map((c) => (
                  <div key={c.id} style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '6px', background: '#fcfcfc' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', fontFamily: 'monospace' }}>
                      Chunk #{c.chunk_no} (ID: {c.id.substring(0, 8)}...)
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: 1.7 }}>{c.content_preview}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Entity 탭 ─── */}
        {activeTab === 'entity' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
              추출된 Entities ({tabLoading ? <Spinner size={14} /> : `${entities.length}개`})
            </h3>
            {tabLoading ? (
              <div style={{ padding: '20px' }}>{Array.from({length: 3}).map((_, i) => <div style={{marginBottom: 16}} key={i}><Skeleton height="80px" /></div>)}</div>
            ) : entities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
                추출된 Entity가 없습니다.<br/>
                <span style={{ fontSize: '13px' }}>인덱싱 작업 중 GraphRAG Entity 추출이 완료된 후 조회됩니다.</span>
              </div>
            ) : (
              <table className="table-area">
                <thead>
                  <tr>
                    <th>Entity 이름</th>
                    <th>유형 (Type)</th>
                    <th>설명 (Description)</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map(e => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 500 }}>{e.name}</td>
                      <td><span style={{ background: '#EEF4FF', color: '#3069B3', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{e.entity_type}</span></td>
                      <td style={{ color: '#666', fontSize: '13px' }}>{e.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── IndexJob 이력 탭 ─── */}
        {activeTab === 'job' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
              IndexJob 이력 ({tabLoading ? <Spinner size={14} /> : `${jobs.length}건`})
            </h3>
            {tabLoading ? (
              <div style={{ padding: '20px' }}>{Array.from({length: 3}).map((_, i) => <div style={{marginBottom: 16}} key={i}><Skeleton height="80px" /></div>)}</div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>인덱싱 이력이 없습니다.</div>
            ) : (
              <table className="table-area">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>시작 일시</th>
                    <th>종료 일시</th>
                    <th>소요 시간</th>
                    <th>진행률</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#3069B3', cursor: 'pointer' }}
                          onClick={() => navigate(`/admin/jobs/${j.id}`)}>
                        {j.id.substring(0, 8)}...
                      </td>
                      <td>{j.started_at}</td>
                      <td>{j.completed_at}</td>
                      <td>{j.duration}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, background: '#eee', borderRadius: '4px', height: '6px' }}>
                            <div style={{ width: `${j.progress_pct}%`, background: '#3069B3', borderRadius: '4px', height: '6px' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#888' }}>{Math.round(j.progress_pct)}%</span>
                        </div>
                      </td>
                      <td><span className={`badge ${statusBadge(j.status)}`}>{j.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '8px', width: '380px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>문서 삭제</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              <strong>[{source?.filename}]</strong>를 삭제하시겠습니까?<br />
              청크 및 임베딩 데이터가 함께 삭제됩니다.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={{ padding: '10px 0', width: '110px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: '14px', cursor: 'pointer' }} onClick={() => setIsDeleteModalOpen(false)}>취소</button>
              <button style={{ padding: '10px 0', width: '110px', borderRadius: '4px', border: 'none', background: '#dc3545', color: '#fff', fontSize: '14px', cursor: 'pointer' }} onClick={handleDelete}>삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceDetail;

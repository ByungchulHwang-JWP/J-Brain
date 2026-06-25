import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const FORM_INPUT = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--color-border)', borderRadius: '6px',
  background: 'var(--color-input-bg)', color: 'var(--color-text-main)',
  fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
};
const FORM_INPUT_DISABLED = {
  ...FORM_INPUT,
  background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)', cursor: 'not-allowed',
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [sources, setSources] = useState([]);
  const [sourceCount, setSourceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('ai_access_token');
        const wsRes = await axios.get('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } });
        const ws = wsRes.data.find(w => w.id === id);
        if (ws) { setName(ws.name); setDescription(ws.description || ''); setStatus(ws.status); }

        const srcRes = await axios.get('/api/v1/sources', { headers: { Authorization: `Bearer ${token}` } });
        const filtered = srcRes.data.filter(s => s.category === id);
        setSources(filtered.slice(0, 5));
        setSourceCount(filtered.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/v1/projects/${id}`, { description, status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ai_access_token')}` }
      });
      alert('저장되었습니다.');
    } catch (err) {
      alert('저장에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/v1/projects/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ai_access_token')}` }
      });
      navigate('/admin/projects');
    } catch (err) {
      alert('삭제에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span style={{ cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => navigate('/admin/projects')}>Project 관리</span>
        {' > '}
        <span style={{ cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => navigate('/admin/projects')}>프로젝트 목록</span>
        {' > '}
        <span>{id} 설정</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>프로젝트 설정</h2>
        <button className="btn-danger" onClick={() => setIsDeleteModalOpen(true)}>프로젝트 삭제</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>로딩 중...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* 왼쪽: 기본 정보 */}
          <div className="panel">
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>기본 정보</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>
                프로젝트 ID (변경 불가)
              </label>
              <input type="text" value={id} disabled style={FORM_INPUT_DISABLED} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>
                프로젝트명 <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} style={FORM_INPUT} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>설명</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...FORM_INPUT, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>상태</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={FORM_INPUT}>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => navigate('/admin/projects')}>취소</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>

          {/* 오른쪽: 현황 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="panel">
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>프로젝트 현황</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: '등록 문서 수', value: sourceCount + '건' },
                  { label: '상태', value: status === 'active' ? '활성' : '비활성' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--color-bg-elevated)', borderRadius: '8px', padding: '16px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-primary)' }}>{item.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>최근 등록 문서</h3>
                <span style={{ fontSize: '13px', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => navigate('/admin/sources')}>
                  전체 보기 →
                </span>
              </div>
              {sources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  등록된 문서가 없습니다.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600 }}>문서명</th>
                      <th style={{ textAlign: 'center', padding: '8px 4px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600 }}>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map(src => (
                      <tr key={src.id}>
                        <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {src.filename || src.file_name}
                        </td>
                        <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
                          <span className={`badge ${src.status === 'success' ? 'active' : src.status === 'error' ? 'error' : 'warning'}`}>
                            {src.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: '380px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--color-text-main)' }}>프로젝트 삭제</h3>
            <p style={{ color: 'var(--color-text-sub)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              <strong>[{name}]</strong> 프로젝트를 삭제하시겠습니까?<br />
              연결된 모든 문서 데이터가 함께 삭제됩니다.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>취소</button>
              <button className="btn-danger" onClick={confirmDelete}>삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

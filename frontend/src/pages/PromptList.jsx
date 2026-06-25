import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useProjects from '../hooks/useProjects';

const FORM_INPUT = {
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-main)',
  fontFamily: 'inherit',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const PromptList = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { projects } = useProjects();

  const [selectedId, setSelectedId] = useState(null);
  const [editDomain, setEditDomain] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('GLOBAL (전역)');
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const token = () => localStorage.getItem('ai_access_token');

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/prompts', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setPrompts(res.data);
      if (res.data.length > 0 && !selectedId) {
        handleSelect(res.data[0]);
      } else if (selectedId) {
        const found = res.data.find(p => p.id === selectedId);
        if (found) handleSelect(found);
        else handleSelect(res.data[0]);
      }
    } catch (err) {
      console.error(err);
      alert('목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrompts(); }, []);

  const handleSelect = (p) => {
    setSelectedId(p.id);
    setEditDomain(p.domain);
    setEditContent(p.content);
    setEditName(p.name);
    setEditStatus(p.status);
  };

  const handleSave = async () => {
    try {
      await axios.patch(`/api/v1/prompts/${selectedId}`, {
        name: editName, domain: editDomain, content: editContent, status: editStatus
      }, { headers: { Authorization: `Bearer ${token()}` } });
      alert('저장되었습니다.');
      fetchPrompts();
    } catch (err) {
      alert('저장에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/v1/prompts/${selectedId}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setIsDeleteModalOpen(false);
      setSelectedId(null);
      fetchPrompts();
    } catch (err) {
      alert('삭제에 실패했습니다: ' + (err.response?.data?.detail || err.message));
      setIsDeleteModalOpen(false);
    }
  };

  const handleNewRegister = async () => {
    if (!newName.trim()) { alert('프롬프트 이름을 입력해주세요.'); return; }
    try {
      await axios.post('/api/v1/prompts', {
        name: newName.trim(), domain: newDomain, content: newContent, status: '활성'
      }, { headers: { Authorization: `Bearer ${token()}` } });
      setIsNewModalOpen(false);
      setNewDomain('GLOBAL (전역)'); setNewName(''); setNewContent('');
      setSelectedId(null);
      fetchPrompts();
    } catch (err) {
      alert('등록에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
  };

  const selectedPrompt = prompts.find(p => p.id === selectedId);

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>테스트/프롬프트</span> {'>'} <span>시스템 프롬프트 관리</span>
      </div>
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700 }}>시스템 프롬프트 관리</h2>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* 좌측: 목록 */}
        <div className="panel" style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>프롬프트 목록</h3>
            <button className="btn-primary" style={{ height: '32px', padding: '0 12px', fontSize: '12px' }} onClick={() => setIsNewModalOpen(true)}>
              + 신규 등록
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>로딩 중...</div>
          ) : prompts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>등록된 프롬프트가 없습니다.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prompts.map(p => (
                <li
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  style={{
                    padding: '16px',
                    border: `1px solid ${selectedId === p.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedId === p.id ? 'var(--color-primary-subtle)' : 'var(--color-bg-elevated)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{p.domain}</span>
                    <span className={`badge ${p.status === '활성' ? 'active' : 'warning'}`}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-main)' }}>{p.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>최종 수정일: {p.updated_at}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 우측: 상세 편집 */}
        <div className="panel" style={{ flex: 2 }}>
          {selectedPrompt ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)' }}>{selectedPrompt.name} 상세 설정</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-danger" onClick={() => setIsDeleteModalOpen(true)}>삭제</button>
                  <button className="btn-primary" onClick={handleSave}>저장</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '160px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>프롬프트 이름</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} style={FORM_INPUT} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>적용 도메인</label>
                    <select value={editDomain} onChange={e => setEditDomain(e.target.value)} style={{ ...FORM_INPUT, width: '160px' }}>
                      <option>GLOBAL (전역)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name || p.id}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>상태</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ ...FORM_INPUT, width: '100px' }}>
                      <option>활성</option>
                      <option>비활성</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-sub)' }}>System Prompt (지시문)</label>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    style={{ ...FORM_INPUT, resize: 'vertical', minHeight: '260px', lineHeight: 1.7, fontFamily: 'monospace', fontSize: '14px', padding: '16px' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    * LLM의 기본 Persona 및 답변 가이드라인을 정의합니다. GraphRAG Context는 이 지시문 아래에 자동으로 주입됩니다.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px', color: 'var(--color-text-muted)' }}>
              {loading ? '로딩 중...' : '좌측에서 프롬프트를 선택하세요.'}
            </div>
          )}
        </div>
      </div>

      {/* 신규 등록 모달 */}
      {isNewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: '480px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>신규 프롬프트 등록</h3>

            <div style={{ marginBottom: '16px' }}>
              <label className="modal-label">프롬프트 이름 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="예: 탄소중립 요약 지침" className="modal-input" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="modal-label">적용 도메인</label>
              <select value={newDomain} onChange={e => setNewDomain(e.target.value)} className="modal-select">
                <option>GLOBAL (전역)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name || p.id}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="modal-label">System Prompt (선택)</label>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={5}
                placeholder="지시문을 입력하세요"
                style={{ ...FORM_INPUT, resize: 'vertical', fontFamily: 'monospace', padding: '12px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsNewModalOpen(false)}>취소</button>
              <button className="btn-primary" onClick={handleNewRegister}>등록하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: '360px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--color-text-main)' }}>프롬프트 삭제</h3>
            <p style={{ color: 'var(--color-text-sub)', fontSize: '14px', marginBottom: '24px' }}>
              <strong>[{selectedPrompt?.name}]</strong>을(를) 삭제하시겠습니까?
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

export default PromptList;

import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Skeleton } from '../components/common/Loader';

const FORM_INPUT = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--color-border)', borderRadius: '6px',
  background: 'var(--color-input-bg)', color: 'var(--color-text-main)',
  fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box', outline: 'none',
};

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('ai_access_token');
      const res = await axios.get('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } });
      setProjects(res.data);
    } catch (error) {
      console.error(error);
      toast.error('프로젝트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = () => { setNewProjectName(''); setNewProjectDesc(''); setIsModalOpen(true); };

  const submitCreate = async () => {
    if (!newProjectName.trim()) { toast.error('프로젝트명을 입력해주세요.'); return; }
    try {
      const token = localStorage.getItem('ai_access_token');
      await axios.post('/api/v1/projects', {
        name: newProjectName.trim(), description: newProjectDesc.trim()
      }, { headers: { Authorization: `Bearer ${token}` } });
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error('생성에 실패했습니다: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>Project 관리</span> {'>'} <span>프로젝트 목록</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700 }}>프로젝트 (Project) 관리</h2>
        <button className="btn-primary" onClick={handleCreate}>+ 신규 프로젝트 생성</button>
      </div>

      <div className="table-area">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>프로젝트명</th>
              <th>설명</th>
              <th>상태</th>
              <th>생성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (<tr key={idx}><td><Skeleton width="100px" /></td><td><Skeleton width="150px" /></td><td><Skeleton width="80px" /></td><td><Skeleton width="200px" /></td><td><Skeleton width="60px" /></td><td><Skeleton width="80px" /></td></tr>))
            ) : projects.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>생성된 프로젝트가 없습니다.</td></tr>
            ) : (
              projects.map(ws => (
                <tr key={ws.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-muted)' }}>{ws.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{ws.name}</td>
                  <td style={{ color: 'var(--color-text-sub)' }}>{ws.description || '-'}</td>
                  <td><span className="badge active">활성</span></td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{ws.created_at || '-'}</td>
                  <td>
                    <button className="btn-table" onClick={() => navigate(`/admin/projects/${ws.id}`)}>설정</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 신규 프로젝트 생성 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: '400px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>신규 프로젝트 생성</h3>
            <div style={{ marginBottom: '16px' }}>
              <label className="modal-label">프로젝트명 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="예: NETZERO, DPPA" className="modal-input" />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="modal-label">설명 (선택)</label>
              <textarea
                value={newProjectDesc}
                onChange={e => setNewProjectDesc(e.target.value)}
                placeholder="프로젝트 설명을 입력하세요"
                rows={3}
                style={{ ...FORM_INPUT, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>취소</button>
              <button className="btn-primary" onClick={submitCreate}>생성하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;

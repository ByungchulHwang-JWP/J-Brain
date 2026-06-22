import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WorkspaceList = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem('ai_access_token');
      const res = await axios.get('/api/v1/workspaces/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkspaces(res.data);
    } catch (error) {
      console.error(error);
      alert('워크스페이스 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async () => {
    const name = prompt('새로운 프로젝트명을 입력하세요 (ex: NETZERO, DPPA):');
    if (!name) return;
    const desc = prompt('설명을 입력하세요 (선택사양):', '');
    
    try {
      const token = localStorage.getItem('ai_access_token');
      await axios.post('/api/v1/workspaces/', {
        name: name.trim(),
        description: desc || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWorkspaces();
    } catch (error) {
      console.error(error);
      alert('생성에 실패했습니다: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>Workspace 관리</span> {'>'} <span>프로젝트 목록</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>프로젝트 (Workspace) 관리</h2>
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
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</td></tr>
            ) : workspaces.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>생성된 프로젝트가 없습니다.</td></tr>
            ) : (
              workspaces.map(ws => (
                <tr key={ws.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>{ws.id}</td>
                  <td style={{ fontWeight: 500 }}>{ws.name}</td>
                  <td>{ws.description || '-'}</td>
                  <td><span className="badge active">활성</span></td>
                  <td>{ws.created_at || '-'}</td>
                  <td>
                    <button className="btn-table">설정</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkspaceList;

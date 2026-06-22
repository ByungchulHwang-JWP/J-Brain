import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KnowledgeBase = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState(''); // To be selected or passed

  // In a real app, you would get this from Context or URL params.
  // For now, we'll just fetch the first workspace to use as default.
  useEffect(() => {
    const fetchInitialWorkspace = async () => {
      try {
        const token = localStorage.getItem('ai_access_token');
        const res = await axios.get('/api/v1/workspaces/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.length > 0) {
          setWorkspaceId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitialWorkspace();
  }, []);

  const fetchSources = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('ai_access_token');
      const res = await axios.get(`/api/v1/workspaces/${workspaceId}/sources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSources(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [workspaceId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !workspaceId) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('ai_access_token');
      await axios.post(`/api/v1/workspaces/${workspaceId}/sources`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('파일 업로드 성공!');
      fetchSources();
    } catch (error) {
      console.error(error);
      alert('업로드 실패');
    }
  };

  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>지식 관리</span> {'>'} <span>문서 목록</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 24px', margin: '0' }}>
        <h2>지식 문서(Source) 관리</h2>
        <div>
          <input 
            type="file" 
            id="file-upload" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
            accept=".pdf,.txt,.docx"
          />
          <label htmlFor="file-upload" className="btn-primary" style={{ display: 'inline-block', lineHeight: '40px', cursor: 'pointer' }}>
            + 새 문서 업로드
          </label>
        </div>
      </div>

      <div className="table-area">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>파일명</th>
              <th>상태</th>
              <th>생성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</td></tr>
            ) : sources.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>등록된 문서가 없습니다.</td></tr>
            ) : (
              sources.map(src => (
                <tr key={src.id}>
                  <td>{src.id}</td>
                  <td style={{ fontWeight: 600 }}>{src.filename}</td>
                  <td>
                    <span className={`badge ${src.status === 'completed' ? 'active' : 'inactive'}`}>
                      {src.status}
                    </span>
                  </td>
                  <td>{new Date(src.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-table">삭제</button>
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

export default KnowledgeBase;

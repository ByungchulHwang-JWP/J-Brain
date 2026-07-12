import React, { useState, useEffect } from 'react';

const ImprovementRequestDrawer = ({ isOpen, onClose, logData, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    request_type: 'INTENT_IMPROVEMENT',
    severity: 'medium',
    description: '',
  });

  useEffect(() => {
    if (logData) {
      setFormData({
        title: `미응답 분석: ${logData.question.substring(0, 15)}...`,
        request_type: logData.suggested_cause === 'Intent 부재' ? 'INTENT_IMPROVEMENT' : 'FAQ_IMPROVEMENT',
        severity: 'medium',
        description: `질문: ${logData.question}\n\n사유: ${logData.suggested_cause}\n기존 상태: ${logData.response_status}`,
      });
    } else {
      setFormData({
        title: '',
        request_type: 'INTENT_IMPROVEMENT',
        severity: 'medium',
        description: '',
      });
    }
  }, [logData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.4)', zIndex: 1000,
          display: isOpen ? 'block' : 'none'
        }}
        onClick={onClose} 
      />
      <div 
        style={{
          position: 'fixed', top: 0, right: isOpen ? '0' : '-600px', width: '500px', height: '100vh',
          background: 'white', boxShadow: '-2px 0 8px rgba(0,0,0,0.15)', zIndex: 1001,
          transition: 'right 0.3s ease-in-out', display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
            {logData ? '미응답 기반 개선 요청 생성' : '새 개선 요청 생성'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
        </div>
        
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>제목</label>
            <input 
              name="title" value={formData.title} onChange={handleChange} placeholder="개선 요청 제목을 입력하세요" 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>개선 대상 유형</label>
            <select 
              name="request_type" value={formData.request_type} onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
            >
              <option value="INTENT_IMPROVEMENT">Intent 개선</option>
              <option value="FAQ_IMPROVEMENT">FAQ 추가/개선</option>
              <option value="ACTION_IMPROVEMENT">Action 기능 개선</option>
              <option value="ENTITY_IMPROVEMENT">Entity/동의어 보완</option>
              <option value="SOURCE_IMPROVEMENT">지식 소스 보강</option>
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>우선순위 (심각도)</label>
            <select 
              name="severity" value={formData.severity} onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', background: 'white' }}
            >
              <option value="high">높음 (High)</option>
              <option value="medium">보통 (Medium)</option>
              <option value="low">낮음 (Low)</option>
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>상세 설명</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              placeholder="개선이 필요한 사유와 반영 방향을 작성해주세요."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' }}
            />
          </div>
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#fafafa' }}>
          <button 
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: '1px solid #ccc', background: 'white', color: '#333' }}
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: '1px solid #1976d2', background: '#1976d2', color: 'white' }}
          >
            요청 생성
          </button>
        </div>
      </div>
    </>
  );
};

export default ImprovementRequestDrawer;

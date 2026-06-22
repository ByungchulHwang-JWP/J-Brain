import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>대시보드</span> {'>'} <span>운영 현황</span>
      </div>
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>시스템 운영 현황</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>등록된 도메인(프로젝트)</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#031B4B' }}>2<span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>총 지식 문서 수 (Sources)</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#031B4B' }}>1,240<span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>진행 중인 인덱싱 작업</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#3069B3' }}>3<span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '4px' }}>건</span></div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>금일 챗봇 세션 수</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#031B4B' }}>54<span style={{ fontSize: '16px', fontWeight: 400, marginLeft: '4px' }}>세션</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>최근 인덱싱 이력</h3>
            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => navigate('/admin/jobs')}>전체보기</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0' }}>NETZERO (FULL_INDEX)</td>
                <td style={{ textAlign: 'right', color: '#888' }}>10분 전</td>
                <td style={{ textAlign: 'right' }}><span className="badge active">성공</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0' }}>DPPA (UPDATE_INDEX)</td>
                <td style={{ textAlign: 'right', color: '#888' }}>1시간 전</td>
                <td style={{ textAlign: 'right' }}><span className="badge error">실패</span></td>
              </tr>
              <tr>
                <td style={{ padding: '12px 0' }}>NETZERO (UPDATE_INDEX)</td>
                <td style={{ textAlign: 'right', color: '#888' }}>3시간 전</td>
                <td style={{ textAlign: 'right' }}><span className="badge active">성공</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>시스템 자원 현황</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span>DB 연결 상태 (PostgreSQL)</span>
                <span style={{ color: '#27ae60', fontWeight: 600 }}>Connected</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span>Graph Storage 사용량</span>
                <span>45% (4.5GB / 10GB)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                <div style={{ width: '45%', height: '100%', background: '#3069B3', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                <span>API Rate Limit (OpenAI)</span>
                <span>12% 사용중</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                <div style={{ width: '12%', height: '100%', background: '#27ae60', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

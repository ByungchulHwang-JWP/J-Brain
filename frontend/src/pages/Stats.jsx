import React from 'react';

const Stats = () => {
  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>대시보드</span> {'>'} <span>사용 통계</span>
      </div>
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>사용 통계 (Statistics)</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        {/* 임시 차트 영역 (CSS 기반) */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>주간 검색 요청 트렌드 (Mock)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '16px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
            {[30, 45, 20, 60, 80, 50, 90].map((val, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                <div style={{ width: '100%', background: '#3069B3', height: `${val}%`, borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                <div style={{ fontSize: '12px', color: '#666' }}>{idx + 1}일</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>도메인별 토큰 사용 비중 (Mock)</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'conic-gradient(#3069B3 0% 65%, #e74c3c 65% 90%, #f1c40f 90% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#fff' }}></div>
            </div>
            <div style={{ marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width:'12px', height:'12px', background: '#3069B3', borderRadius:'2px'}}></span> NETZERO (65%)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width:'12px', height:'12px', background: '#e74c3c', borderRadius:'2px'}}></span> DPPA (25%)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width:'12px', height:'12px', background: '#f1c40f', borderRadius:'2px'}}></span> 기타 (10%)</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>API 호출 상세 통계</h3>
        <table className="table-area">
          <thead>
            <tr>
              <th>도메인</th>
              <th>총 요청 수</th>
              <th>평균 응답 시간</th>
              <th>토큰 사용량 (Input)</th>
              <th>토큰 사용량 (Output)</th>
              <th>사용 요금 추정</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 500 }}>NETZERO</td>
              <td>1,204건</td>
              <td>1.4초</td>
              <td>450,000</td>
              <td>120,000</td>
              <td>$2.45</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 500 }}>DPPA</td>
              <td>450건</td>
              <td>1.1초</td>
              <td>180,000</td>
              <td>45,000</td>
              <td>$0.98</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Stats;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner } from '../components/common/Loader';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = () => localStorage.getItem('ai_access_token');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/v1/stats', {
          headers: { Authorization: `Bearer ${token()}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="inner" style={{ padding: '60px', textAlign: 'center' }}><Spinner size={32} color="var(--color-primary)" /><p style={{marginTop: 16, color: 'var(--color-text-muted)'}}>통계 데이터를 불러오는 중입니다...</p></div>;
  if (!stats) return <div className="inner" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>데이터를 불러올 수 없습니다.</div>;

  const maxVal = Math.max(...stats.weekly_trend);

  let currentAngle = 0;
  const gradientParts = stats.domain_share.map(d => {
    const angle = (d.value / 100) * 360;
    const part = `${d.color} ${currentAngle}deg ${currentAngle + angle}deg`;
    currentAngle += angle;
    return part;
  }).join(', ');

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>대시보드</span> {'>'} <span>사용 통계</span>
      </div>
      <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700 }}>사용 통계 (Statistics)</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        {/* 주간 트렌드 바 차트 */}
        <div className="panel" style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>주간 검색 요청 트렌드</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            {stats.weekly_trend.map((val, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{val}</span>
                <div style={{ width: '100%', background: 'var(--color-primary)', height: `${(val/maxVal)*100}%`, borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{idx + 1}일전</div>
              </div>
            ))}
          </div>
        </div>

        {/* 도넛 차트 */}
        <div className="panel" style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>도메인별 토큰 사용 비중</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: `conic-gradient(${gradientParts})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-bg-surface)' }}></div>
            </div>
            <div style={{ marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--color-text-sub)' }}>
              {stats.domain_share.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: d.color, borderRadius: '3px', flexShrink: 0 }}></span>
                  {d.name} ({d.value}%)
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* API 상세 통계 테이블 */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>API 호출 상세 통계</h3>
        </div>
        <table>
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
            {stats.details.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{row.domain}</td>
                <td style={{ color: 'var(--color-text-sub)' }}>{row.total_req}</td>
                <td style={{ color: 'var(--color-text-sub)' }}>{row.avg_time}</td>
                <td style={{ color: 'var(--color-text-sub)' }}>{row.token_in}</td>
                <td style={{ color: 'var(--color-text-sub)' }}>{row.token_out}</td>
                <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{row.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Stats;

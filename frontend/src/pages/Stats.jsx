import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner } from '../components/common/Loader';
import { useProjectContext } from '../context/ProjectContext';

const Stats = ({ embedded = false, mode = 'system' }) => {
  const { selectedProjectId } = useProjectContext();
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

  const wrapperClassName = embedded ? '' : 'inner';
  const title = mode === 'operations' ? '운영 사용 통계' : '사용 통계 (Statistics)';
  const eyebrow = mode === 'operations' ? '운영 인사이트' : '대시보드';
  const description = mode === 'operations'
    ? '선택 프로젝트의 Runtime 사용량, 요청 추이, 도메인별 사용 비중을 운영 관점에서 확인합니다.'
    : '';

  const visibleStats = mode === 'operations' && selectedProjectId && stats
    ? {
        ...stats,
        domain_share: (stats.domain_share || []).filter((item) => item.name === selectedProjectId),
        details: (stats.details || []).filter((item) => item.domain === selectedProjectId),
      }
    : stats;

  if (visibleStats && mode === 'operations' && selectedProjectId) {
    if (!visibleStats.domain_share.length) {
      visibleStats.domain_share = [{ name: selectedProjectId, value: 100, color: '#888888' }];
    }
    if (!visibleStats.details.length) {
      visibleStats.details = [{
        domain: selectedProjectId,
        total_req: '0건',
        avg_time: '-',
        token_in: 0,
        token_out: 0,
        cost: '$0.0',
      }];
    }
  }

  if (loading) return <div className={wrapperClassName} style={{ padding: embedded ? '40px 0' : '60px', textAlign: 'center' }}><Spinner size={32} color="var(--color-primary)" /><p style={{marginTop: 16, color: 'var(--color-text-muted)'}}>통계 데이터를 불러오는 중입니다...</p></div>;
  if (!visibleStats) return <div className={wrapperClassName} style={{ padding: embedded ? '24px 0' : '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>데이터를 불러올 수 없습니다.</div>;

  const maxVal = Math.max(...visibleStats.weekly_trend, 1);

  let currentAngle = 0;
  const gradientParts = visibleStats.domain_share.map(d => {
    const angle = (d.value / 100) * 360;
    const part = `${d.color} ${currentAngle}deg ${currentAngle + angle}deg`;
    currentAngle += angle;
    return part;
  }).join(', ');

  return (
    <div className={wrapperClassName} style={{ paddingBottom: embedded ? 0 : '60px' }}>
      {!embedded && (
        <>
          <div className="breadcrumb">
            <span>{eyebrow}</span> {'>'} <span>사용 통계</span>
          </div>
          <div className="page-header" style={{ padding: '12px 0 20px', margin: '0' }}>
            <h2 style={{ fontWeight: 700 }}>{title}</h2>
            {description && <p style={{ marginTop: '8px', color: 'var(--color-text-sub)' }}>{description}</p>}
          </div>
        </>
      )}
      {embedded && (
        <div className="console-embedded-toolbar">
          <div>
            <h3>운영 지표</h3>
            <p>{description || '시스템 사용 통계를 확인합니다.'}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        {/* 주간 트렌드 바 차트 */}
        <div className="panel" style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>주간 검색 요청 트렌드</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            {visibleStats.weekly_trend.map((val, idx) => (
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
              {visibleStats.domain_share.map((d, i) => (
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
      <div className="panel" style={{ padding: 0, overflowX: 'auto', overflowY: 'hidden' }}>
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
            {visibleStats.details.map((row, i) => (
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

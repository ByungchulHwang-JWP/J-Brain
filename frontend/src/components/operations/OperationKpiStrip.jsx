import React from 'react';
import { Layers, MessageSquare, Target, AlertTriangle, Activity, Shield } from 'lucide-react';

const KpiCard = ({ icon: Icon, iconBg, iconColor, title, value, unit, badge, trend, trendColor, trendText, extra }) => (
  <div className="panel" style={{
    flex: 1,
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minWidth: '220px',
    borderRadius: '12px'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: iconBg,
      color: iconColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={24} />
    </div>
    
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: '14px', color: 'var(--color-text-main)', fontWeight: 600 }}>{unit}</span>}
        {badge && (
          <span style={{ 
            fontSize: '11px', padding: '2px 6px', borderRadius: '10px', 
            backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success-text)', fontWeight: 600, marginLeft: '4px'
          }}>
            {badge}
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend && <span style={{ color: trendColor, fontWeight: 600 }}>{trend}</span>}
          <span style={{ color: 'var(--color-text-muted)' }}>{trendText}</span>
        </div>
        {extra && <div>{extra}</div>}
      </div>
    </div>
  </div>
);

const ProgressBar = ({ percent, color }) => (
  <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
    <div style={{ width: `${percent}%`, height: '100%', backgroundColor: color, borderRadius: '2px' }} />
  </div>
);

const MiniChart = () => (
  <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
    <path d="M0 16L4 12L8 14L12 8L16 10L20 4L24 6L28 2L32 6L36 0L40 4V16H0Z" fill="rgba(33, 150, 243, 0.15)" />
    <path d="M0 16L4 12L8 14L12 8L16 10L20 4L24 6L28 2L32 6L36 0L40 4" stroke="#2196f3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const OperationKpiStrip = ({ data }) => {
  if (!data) return null;

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <KpiCard 
        icon={Layers} iconBg="rgba(33, 150, 243, 0.1)" iconColor="#2196f3"
        title="Active Pack 버전" 
        value={data.active_pack}
        badge="최신"
        trendText="배포일 2026.07.12 15:30"
      />
      <KpiCard 
        icon={MessageSquare} iconBg="rgba(33, 150, 243, 0.1)" iconColor="#2196f3"
        title="최근 1시간 요청 수" 
        value={data.requests_last_hour} unit="건"
        trend="▲ 18.6%" trendColor="#2196f3" trendText="(vs 1시간 전)"
        extra={<MiniChart />}
      />
      <KpiCard 
        icon={Target} iconBg="rgba(76, 175, 80, 0.1)" iconColor="#4caf50"
        title="Intent 매칭률" 
        value={data.intent_match_rate.toFixed(1)} unit="%"
        trend="▲ 4.1%" trendColor="#4caf50" trendText="(vs 1시간 전)"
        extra={<ProgressBar percent={82} color="#4caf50" />}
      />
      <KpiCard 
        icon={AlertTriangle} iconBg="rgba(244, 67, 54, 0.1)" iconColor="#f44336"
        title="Fallback 발생률" 
        value={data.fallback_rate.toFixed(1)} unit="%"
        trend="▼ 4.1%" trendColor="#f44336" trendText="(vs 1시간 전)"
        extra={<ProgressBar percent={17} color="#f44336" />}
      />
      <KpiCard 
        icon={Activity} iconBg="rgba(156, 39, 176, 0.1)" iconColor="#9c27b0"
        title="평균 응답 시간" 
        value={Math.round(data.avg_response_time)} unit="ms"
        trend="▼ 36ms" trendColor="#4caf50" trendText="(vs 1시간 전)"
        extra={<ProgressBar percent={40} color="#9c27b0" />}
      />
      <KpiCard 
        icon={Shield} iconBg="rgba(76, 175, 80, 0.1)" iconColor="#4caf50"
        title="오류 발생 수" 
        value={data.error_count} unit="건"
        trend="—" trendColor="var(--color-text-muted)" trendText="(vs 1시간 전)"
        extra={<ProgressBar percent={5} color="#e0e0e0" />}
      />
    </div>
  );
};

export default OperationKpiStrip;

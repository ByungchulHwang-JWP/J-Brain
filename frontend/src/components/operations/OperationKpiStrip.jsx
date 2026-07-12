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

import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

const ProgressBar = ({ percent, color }) => (
  <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, Math.max(0, percent))}%`, height: '100%', backgroundColor: color, borderRadius: '2px' }} />
  </div>
);

const MiniChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ width: '40px', height: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area 
            type="monotone" 
            dataKey="requests" 
            stroke="#2196f3" 
            fill="rgba(33, 150, 243, 0.15)" 
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const OperationKpiStrip = ({ data, trend }) => {
  if (!data) return null;

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <KpiCard 
        icon={Layers} iconBg="rgba(33, 150, 243, 0.1)" iconColor="#2196f3"
        title="Active Pack 버전" 
        value={data.active_pack}
        badge="최신"
        trendText="현재 서비스 중인 모델 팩입니다."
      />
      <KpiCard 
        icon={MessageSquare} iconBg="rgba(33, 150, 243, 0.1)" iconColor="#2196f3"
        title="최근 1시간 요청 수" 
        value={data.requests_last_hour} unit="건"
        trendText="(최근 12시간 추이)"
        extra={<MiniChart data={trend} />}
      />
      <KpiCard 
        icon={Target} iconBg="rgba(76, 175, 80, 0.1)" iconColor="#4caf50"
        title="Intent 매칭률" 
        value={data.intent_match_rate.toFixed(1)} unit="%"
        trendText="(안정권: 80% 이상)"
        extra={<ProgressBar percent={data.intent_match_rate} color="#4caf50" />}
      />
      <KpiCard 
        icon={AlertTriangle} iconBg="rgba(244, 67, 54, 0.1)" iconColor="#f44336"
        title="Fallback 발생률" 
        value={data.fallback_rate.toFixed(1)} unit="%"
        trendText="(경고: 15% 이상)"
        extra={<ProgressBar percent={data.fallback_rate} color="#f44336" />}
      />
      <KpiCard 
        icon={Activity} iconBg="rgba(156, 39, 176, 0.1)" iconColor="#9c27b0"
        title="평균 응답 시간" 
        value={Math.round(data.avg_response_time)} unit="ms"
        trendText="(적정: 500ms 미만)"
        extra={<ProgressBar percent={Math.min((data.avg_response_time / 1000) * 100, 100)} color="#9c27b0" />}
      />
      <KpiCard 
        icon={Shield} iconBg="rgba(76, 175, 80, 0.1)" iconColor="#4caf50"
        title="오류 발생 수" 
        value={data.error_count} unit="건"
        trendText="(최근 1시간 통계)"
        extra={<ProgressBar percent={data.error_count > 0 ? 100 : 0} color="#e0e0e0" />}
      />
    </div>
  );
};

export default OperationKpiStrip;

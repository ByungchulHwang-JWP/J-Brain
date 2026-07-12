import React from 'react';
import { ShieldCheck, AlertTriangle, Info, ChevronRight } from 'lucide-react';

const SparklineChart = ({ color, gradientId }) => (
  <svg 
    width="100%" 
    height="100%" 
    viewBox="0 0 300 100" 
    preserveAspectRatio="none" 
    style={{ position: 'absolute', right: 0, bottom: 0, width: '40%', height: '80%', zIndex: 0, opacity: 0.8 }}
  >
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    <path 
      d="M0 80 Q 30 70, 60 80 T 120 70 T 180 50 T 240 60 T 300 40 L 300 100 L 0 100 Z" 
      fill={`url(#${gradientId})`} 
    />
    <path 
      d="M0 80 Q 30 70, 60 80 T 120 70 T 180 50 T 240 60 T 300 40" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeDasharray="4 4"
    />
    <circle cx="60" cy="80" r="3" fill={color} />
    <circle cx="120" cy="70" r="3" fill={color} />
    <circle cx="180" cy="50" r="3" fill={color} />
    <circle cx="240" cy="60" r="3" fill={color} />
    <circle cx="300" cy="40" r="3" fill={color} />
  </svg>
);

const OperationHealthPanel = ({ type = 'health', title, statusBadge, description, metrics, onAction }) => {
  const isHealthy = type === 'health';
  
  const iconColor = isHealthy ? '#4caf50' : '#ff9800';
  const iconBg = isHealthy ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)';
  const badgeBg = isHealthy ? 'var(--color-success-subtle)' : '#ffebee';
  const badgeColor = isHealthy ? 'var(--color-success-text)' : '#c62828';
  const Icon = isHealthy ? ShieldCheck : AlertTriangle;
  const ActionIcon = isHealthy ? Info : ChevronRight;

  return (
    <div 
      className="panel" 
      style={{
        position: 'relative',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        cursor: isHealthy ? 'default' : 'pointer',
        overflow: 'hidden'
      }}
      onClick={!isHealthy ? onAction : undefined}
    >
      <SparklineChart color={iconColor} gradientId={`sparkline-${type}`} />
      
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)' }}>{title}</h3>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: badgeBg,
                color: badgeColor
              }}>
                {statusBadge}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>{description}</div>
          </div>
        </div>
        
        <div style={{ color: 'var(--color-text-muted)', cursor: isHealthy ? 'help' : 'pointer' }}>
          <ActionIcon size={20} />
        </div>
      </div>

      <div style={{ 
        position: 'relative', 
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '40px'
      }}>
        {metrics.map((metric, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            flexDirection: 'column',
            borderLeft: index > 0 ? '1px solid var(--color-border)' : 'none',
            paddingLeft: index > 0 ? '40px' : '0'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '8px', fontWeight: 500 }}>
              {metric.label}
            </span>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              color: metric.valueColor || 'var(--color-text-main)'
            }}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperationHealthPanel;

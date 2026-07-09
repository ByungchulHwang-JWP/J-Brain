import React from 'react';
import { Loader2 } from 'lucide-react';
import './Loader.css';

// 1. Spinner (Button or inline loader)
export const Spinner = ({ size = 16, color = 'currentColor', className = '' }) => (
  <Loader2 
    size={size} 
    color={color} 
    className={`animate-spin ${className}`} 
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  />
);

// 2. Skeleton (Block loader for tables, cards, etc.)
export const Skeleton = ({ width = '100%', height = '1em', borderRadius = '4px', className = '' }) => (
  <span 
    className={`skeleton-box ${className}`} 
    style={{ width, height, borderRadius }} 
  />
);

// 3. OverlayLoader (Full screen or container blocking loader)
export const OverlayLoader = ({ title = '처리 중입니다...', description = '잠시만 기다려주세요.' }) => (
  <div className="overlay-loader-backdrop">
    <div className="overlay-loader-content">
      <Spinner size={32} color="var(--color-primary)" />
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </div>
  </div>
);

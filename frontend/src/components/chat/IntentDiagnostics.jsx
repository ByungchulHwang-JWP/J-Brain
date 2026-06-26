import React from 'react';

const IntentDiagnostics = ({ diagnostics, matches }) => {
  if (!diagnostics && (!matches || matches.length === 0)) return null;

  const payload = {
    diagnostics: diagnostics || null,
    matches: matches || [],
  };

  return (
    <details style={{
      marginTop: '10px',
      padding: '10px 12px',
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'var(--color-text-sub)',
    }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--color-text-main)' }}>
        의도 진단
      </summary>
      <pre style={{
        margin: '10px 0 0',
        padding: '10px',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        color: 'var(--color-text-main)',
        fontSize: '12px',
        lineHeight: 1.5,
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
      }}>
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  );
};

export default IntentDiagnostics;

import React from 'react';
import { useNavigate } from 'react-router-dom';

const baseCardStyle = {
  padding: '16px',
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '12px',
  color: 'var(--color-primary)',
  fontWeight: 700,
};

const titleStyle = {
  margin: 0,
  fontSize: '16px',
  color: 'var(--color-text-main)',
  fontWeight: 700,
};

const messageStyle = {
  margin: 0,
  color: 'var(--color-text-sub)',
  lineHeight: 1.6,
  fontSize: '14px',
};

const metaStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  fontSize: '12px',
  color: 'var(--color-text-sub)',
};

const chipStyle = {
  padding: '4px 8px',
  borderRadius: '6px',
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border)',
  fontWeight: 600,
};

const dataPanelStyle = {
  padding: '12px',
  background: 'var(--color-primary-subtle)',
  border: '1px solid var(--color-primary-glow)',
  borderRadius: '6px',
  fontSize: '13px',
  color: 'var(--color-text-sub)',
};

const compactRowStyle = {
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  background: 'var(--color-bg-elevated)',
  fontSize: '13px',
  color: 'var(--color-text-sub)',
};

const renderHeader = (label, title) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={labelStyle}>{label}</div>
    <h4 style={titleStyle}>{title || '작업 카드'}</h4>
  </div>
);

const renderCardMeta = (card, extra = []) => {
  const values = [
    card.intent_id,
    card.action_id,
    card.confidence_label,
    ...extra,
  ].filter(value => value !== undefined && value !== null && value !== '');

  if (values.length === 0) return null;

  return (
    <div style={metaStyle}>
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={chipStyle}>{String(value)}</span>
      ))}
    </div>
  );
};

const ActionCard = ({ card }) => {
  const navigate = useNavigate();

  if (!card) return null;

  if (card.type === 'navigation_card') {
    return (
      <div style={baseCardStyle}>
        {renderHeader('이동', card.title)}
        {card.message && <p style={messageStyle}>{card.message}</p>}
        {renderCardMeta(card)}
        {card.route && (
          <button
            className="btn-primary"
            style={{ width: 'fit-content', minWidth: '160px', height: '38px' }}
            onClick={() => navigate(card.route)}
          >
            {card.button_label || '열기'}
          </button>
        )}
      </div>
    );
  }

  if (card.type === 'document_card') {
    const sources = Array.isArray(card.sources) ? card.sources : [];
    const summary = card.source_summary || {};

    return (
      <div style={baseCardStyle}>
        {renderHeader('문서', card.title)}
        {card.message && <p style={messageStyle}>{card.message}</p>}
        {renderCardMeta(card, [
          `FAQ ${summary.faq_count ?? 0}`,
          `문서 ${summary.document_count ?? 0}`,
        ])}
        {card.query && <div style={dataPanelStyle}>검색 질의: {card.query}</div>}
        {sources.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sources.map((sourceItem, index) => {
              const source = sourceItem && typeof sourceItem === 'object' ? sourceItem : { snippet: sourceItem };
              const isFaq = source.source_type === 'faq';

              return (
                <div key={source.faq_id || source.source_id || index} style={compactRowStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--color-text-main)', fontSize: '13px' }}>
                      {isFaq ? source.question || source.title || 'FAQ 질문 없음' : source.title || '제목 없음'}
                    </strong>
                    {source.score !== undefined && source.score !== null && (
                      <span style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700 }}>Score {source.score}</span>
                    )}
                  </div>
                  {isFaq ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.5 }}>
                      <div><strong style={{ color: 'var(--color-text-main)' }}>답변</strong>: {source.answer || source.snippet || '-'}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                        FAQ ID {source.faq_id || '-'} · 카테고리 {source.category || '-'} · Source ID {source.source_id || '-'}
                      </div>
                      {Array.isArray(source.tags) && source.tags.length > 0 && (
                        <div style={metaStyle}>
                          {source.tags.map(tag => <span key={tag} style={chipStyle}>{tag}</span>)}
                        </div>
                      )}
                    </div>
                  ) : (
                    source.snippet && <div style={{ lineHeight: 1.5 }}>{String(source.snippet)}</div>
                  )}
                  <div style={{ marginTop: '8px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    {[source.source_type, source.source_id, source.source_ref].filter(Boolean).join(' · ')}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>표시할 근거 문서가 없습니다.</div>
        )}
      </div>
    );
  }

  if (card.type === 'query_card') {
    const result = card.mock_result && typeof card.mock_result === 'object' ? card.mock_result : {};
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const realData = Array.isArray(card.real_data) ? card.real_data : [];

    return (
      <div style={baseCardStyle}>
        {renderHeader('조회', card.title)}
        {card.message && <p style={messageStyle}>{card.message}</p>}
        {renderCardMeta(card, [
          card.status,
          card.confirmation_required !== undefined ? `확인: ${String(card.confirmation_required)}` : null,
        ])}
        {result.metric && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '10px',
            ...dataPanelStyle,
          }}>
            {[
              ['대상', result.target_name],
              ['기간', result.period],
              ['지표', result.metric],
              ['값', `${result.value ?? '-'} ${result.unit || ''}`.trim()],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 700 }}>{label}</div>
                <div style={{ color: 'var(--color-text-main)', fontSize: '15px', fontWeight: 700 }}>{value || '-'}</div>
              </div>
            ))}
          </div>
        )}
        {realData.length > 0 && (
          <div style={{ overflowX: 'auto', background: 'var(--color-bg-elevated)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}>
                  {Object.keys(realData[0]).map(key => (
                    <th key={key} style={{ padding: '8px 12px', fontWeight: 700 }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {realData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: idx !== realData.length - 1 ? '1px solid var(--color-border)' : 'none', color: 'var(--color-text-sub)' }}>
                    {Object.values(row).map((val, i) => (
                      <td key={i} style={{ padding: '8px 12px' }}>{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rows.map((row, index) => {
              const rowEntries = row && typeof row === 'object'
                ? Object.entries(row)
                : [['값', row ?? '-']];

              return (
                <div key={`${card.action_id || 'row'}-${index}`} style={compactRowStyle}>
                  {rowEntries.map(([key, value]) => (
                    <span key={key} style={{ marginRight: '12px' }}>
                      <strong style={{ color: 'var(--color-text-main)' }}>{key}</strong>: {String(value)}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        {card.parameters && (
          <pre style={{ margin: 0, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '12px', color: 'var(--color-text-main)', fontSize: '12px', overflowX: 'auto' }}>
            {JSON.stringify(card.parameters, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (card.type === 'download_card') {
    return (
      <div style={baseCardStyle}>
        {renderHeader('다운로드', card.title)}
        {card.message && <p style={messageStyle}>{card.message}</p>}
        {renderCardMeta(card, [
          card.status,
          card.confirmation_required !== undefined ? `확인: ${String(card.confirmation_required)}` : null,
        ])}
        {card.download_url && (
          <a
            className="btn-primary"
            href={card.download_url}
            target="_blank"
            rel="noreferrer"
            style={{ width: 'fit-content', minWidth: '180px', height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            {card.button_label || `${card.file_name || '파일'} 다운로드`}
          </a>
        )}
      </div>
    );
  }

  if (card.type === 'guide_card') {
    return (
      <div style={baseCardStyle}>
        {renderHeader('안내', card.title)}
        {card.message && <p style={messageStyle}>{card.message}</p>}
        {renderCardMeta(card)}
      </div>
    );
  }

  return (
    <div style={baseCardStyle}>
      {renderHeader('미매칭', card.title || '답변을 찾지 못했습니다')}
      {card.message && <p style={messageStyle}>{card.message}</p>}
      <div style={metaStyle}>
        {card.confidence_label && <span style={chipStyle}>{card.confidence_label}</span>}
        {card.logged !== undefined && <span style={chipStyle}>기록: {String(card.logged)}</span>}
        {card.log_id && <span style={chipStyle}>로그: {card.log_id}</span>}
      </div>
    </div>
  );
};

export default ActionCard;

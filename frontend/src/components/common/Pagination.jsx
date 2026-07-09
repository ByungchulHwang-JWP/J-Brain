import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="pagination-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-bg-base)',
      fontSize: '13px',
      color: 'var(--color-text-sub)'
    }}>
      <div className="pagination-total">
        Total: <strong>{totalItems}</strong> results
      </div>
      
      <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="pagination-size" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            style={{
              padding: '4px 24px 4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-text)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        
        <div className="pagination-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ minWidth: '60px', textAlign: 'center' }}>
            {totalPages > 0 ? currentPage : 0} / {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handlePrev}
              disabled={currentPage <= 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                backgroundColor: currentPage <= 1 ? 'var(--color-bg-subtle)' : 'var(--color-bg-elevated)',
                color: currentPage <= 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage >= totalPages || totalPages === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                backgroundColor: currentPage >= totalPages || totalPages === 0 ? 'var(--color-bg-subtle)' : 'var(--color-bg-elevated)',
                color: currentPage >= totalPages || totalPages === 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
                cursor: currentPage >= totalPages || totalPages === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

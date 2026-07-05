/* eslint-disable react/prop-types */
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({
  open,
  title = '확인',
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  tone = 'default',
  requireText,
  inputValue = '',
  onInputChange,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;

  const confirmDisabled = loading || (requireText && inputValue !== requireText);

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel?.()}>
      <section className={`modal-box confirm-modal ${tone}`} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <button className="confirm-modal-close" type="button" onClick={onCancel} aria-label="닫기">
          <X size={18} />
        </button>
        <div className="confirm-modal-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </div>
        <h3 id="confirm-modal-title">{title}</h3>
        {description && <p>{description}</p>}

        {requireText && (
          <label className="confirm-modal-field">
            <span>확인 문구 입력: <strong>{requireText}</strong></span>
            <input
              type="text"
              className="modal-input"
              value={inputValue}
              onChange={(event) => onInputChange?.(event.target.value)}
              placeholder={requireText}
            />
          </label>
        )}

        <div className="confirm-modal-actions">
          <button className="btn-secondary" type="button" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button className={tone === 'danger' ? 'btn-danger' : 'btn-primary'} type="button" onClick={onConfirm} disabled={confirmDisabled}>
            {loading ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmModal;

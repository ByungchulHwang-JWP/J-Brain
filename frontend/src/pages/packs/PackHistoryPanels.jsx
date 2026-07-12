import { Download } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import { getPackExportDownloadUrl } from '../../api/intentFactory';

const PackHistoryPanels = ({
  exports,
  auditLogs,
  projectId,
  operationKey,
  activePack,
  onImport,
  onRollback,
  exportPaginationProps,
  auditPaginationProps,
}) => (
  <div className="pack-lifecycle-history">
    <details className="pack-lifecycle-panel" open>
      <summary>Release Export ZIP 이력</summary>
      <div className="pack-lifecycle-history-body">
        <div className="pack-lifecycle-history-actions">
          <button className="btn-secondary" onClick={onRollback} disabled={!activePack?.previous_pack_id || Boolean(operationKey)}>
            {operationKey === 'rollback' ? '되돌리는 중...' : '이전 Pack으로 되돌리기'}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Export ID</th>
              <th>Pack</th>
              <th>Export 상태</th>
              <th>Counts</th>
              <th>Created</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {exports.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>Export된 Pack이 없습니다.</td></tr>
            ) : exports.map((item) => (
              <tr key={item.export_id}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.export_id}</td>
                <td>{item.pack_id} v{item.pack_version}</td>
                <td><span className={`badge ${item.status === 'validated' ? 'active' : 'warning'}`}>{item.status}</span></td>
                <td style={{ color: 'var(--color-text-sub)' }}>Intent {item.counts?.intents ?? 0}, Entity {item.counts?.entities ?? 0}, FAQ {item.counts?.faqs ?? 0}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{item.created_at || '-'}</td>
                <td>
                  <div className="pack-repository-action-cell">
                    <a className="btn-table pack-action-button" href={getPackExportDownloadUrl(projectId, item.export_id)} target="_blank" rel="noreferrer" title="ZIP 다운로드">
                      <Download size={13} /> ZIP
                    </a>
                    <button className="btn-table primary pack-action-button" onClick={() => onImport(item.export_id)} disabled={Boolean(operationKey)}>
                      {operationKey === `import:${item.export_id}` ? '반입 중...' : 'Runtime Store 반입'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exportPaginationProps && <Pagination {...exportPaginationProps} />}
      </div>
    </details>

    <details className="pack-lifecycle-panel">
      <summary>Pack Operation Audit</summary>
      <div className="pack-lifecycle-history-body">
        <table>
          <thead>
            <tr>
              <th>작업</th>
              <th>Pack</th>
              <th>상태</th>
              <th>메시지</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>감사 로그가 없습니다.</td></tr>
            ) : auditLogs.map((log, index) => (
              <tr key={`${log.operation}-${log.created_at}-${index}`}>
                <td>{log.operation}</td>
                <td>{log.pack_id ? `${log.pack_id} v${log.pack_version}` : '-'}</td>
                <td><span className="badge active">{log.status}</span></td>
                <td style={{ color: 'var(--color-text-sub)' }}>{log.message || '-'}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{log.created_at || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {auditPaginationProps && <Pagination {...auditPaginationProps} />}
      </div>
    </details>
  </div>
);

export default PackHistoryPanels;

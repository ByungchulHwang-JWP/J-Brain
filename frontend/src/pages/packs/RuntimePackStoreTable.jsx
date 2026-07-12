import Pagination from '../../components/common/Pagination';
import { getRuntimePackDeploymentState } from './packLifecycleModel';

const RuntimePackStoreTable = ({
  packs,
  activePack,
  operationKey,
  onApprove,
  onReject,
  onActivate,
  paginationProps,
}) => (
  <section className="pack-lifecycle-panel pack-runtime-store-panel">
    <div className="pack-lifecycle-panel-head">
      <div>
        <h3>현재 작업: Runtime Pack Store</h3>
        <p>반입된 Pack을 승인하고, 승인된 Pack만 챗봇에 적용합니다.</p>
      </div>
      <span className="badge warning">챗봇 적용 대기 확인</span>
    </div>
    <table className="pack-runtime-store-table">
      <colgroup>
        <col className="pack-runtime-col-pack" />
        <col className="pack-runtime-col-status" />
        <col className="pack-runtime-col-chat" />
        <col className="pack-runtime-col-next" />
        <col className="pack-runtime-col-owner" />
        <col className="pack-runtime-col-actions" />
      </colgroup>
      <thead>
        <tr>
          <th>Pack</th>
          <th>배포 상태</th>
          <th>챗봇 적용</th>
          <th>다음 작업</th>
          <th>승인자</th>
          <th>작업</th>
        </tr>
      </thead>
      <tbody>
        {packs.length === 0 ? (
          <tr>
            <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
              반입된 Runtime Pack이 없습니다.
            </td>
          </tr>
        ) : packs.map((pack) => {
          const state = getRuntimePackDeploymentState(pack, activePack);
          const operationId = pack.import_id || `${pack.pack_id}:${pack.pack_version}`;
          return (
            <tr key={pack.import_id || `${pack.pack_id}:${pack.pack_version}`}>
              <td className="pack-lifecycle-pack-cell">
                <div className="pack-lifecycle-pack-title">
                  <strong>{pack.pack_id} v{pack.pack_version}</strong>
                  {state.isActive && <span className="badge active">챗봇 적용 중</span>}
                </div>
                <small className="pack-lifecycle-table-sub">Import ID: {pack.import_id || '-'}</small>
                <small className="pack-lifecycle-table-sub">Source Export: {pack.source_export_id || '-'}</small>
              </td>
              <td><span className={`badge ${state.statusClassName}`}>{state.statusLabel}</span></td>
              <td><span className={`badge ${state.chatClassName}`}>{state.chatAppliedLabel}</span></td>
              <td className="pack-lifecycle-next-action">{state.nextAction}</td>
              <td style={{ color: 'var(--color-text-sub)' }}>
                {pack.approved_by || '-'}
                {pack.rejected_reason ? ` / ${pack.rejected_reason}` : ''}
              </td>
              <td>
                <div className="pack-repository-action-cell">
                  <button
                    className={state.allowedActions.approve ? "btn-primary pack-action-button" : "btn-table pack-action-button"}
                    onClick={() => onApprove(pack)}
                    disabled={!state.allowedActions.approve || Boolean(operationKey)}
                  >
                    {operationKey === `approve:${operationId}` ? '승인 중...' : '운영 승인'}
                  </button>
                  <button
                    className={state.allowedActions.reject ? "btn-danger pack-action-button" : "btn-table pack-action-button"}
                    onClick={() => onReject(pack)}
                    disabled={!state.allowedActions.reject || Boolean(operationKey)}
                  >
                    {operationKey === `reject:${operationId}` ? '반려 중...' : '반려'}
                  </button>
                  <button
                    className={state.allowedActions.activate ? "btn-primary pack-action-button" : "btn-table pack-action-button"}
                    style={state.allowedActions.activate ? { backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}}
                    onClick={() => onActivate(pack)}
                    disabled={!state.allowedActions.activate || Boolean(operationKey)}
                  >
                    {operationKey === `activate:${operationId}` ? '적용 중...' : '챗봇에 적용'}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    {paginationProps && <Pagination {...paginationProps} />}
  </section>
);

export default RuntimePackStoreTable;

const PackLifecycleSummary = ({ summary, validationLabel = '최근 검증 정보 없음' }) => (
  <section className="pack-lifecycle-summary-grid" aria-label="Pack Lifecycle Summary">
    <div className="pack-lifecycle-summary-card primary">
      <span>다음 필요 작업</span>
      <strong>{summary.nextActionLabel}</strong>
    </div>
    <div className="pack-lifecycle-summary-card">
      <span>현재 챗봇 적용 Pack</span>
      <strong>{summary.activeLabel}</strong>
    </div>
    <div className="pack-lifecycle-summary-card">
      <span>Rollback 후보</span>
      <strong>{summary.rollbackLabel}</strong>
    </div>
    <div className="pack-lifecycle-summary-card">
      <span>최근 검증</span>
      <strong>{validationLabel}</strong>
    </div>
  </section>
);

export default PackLifecycleSummary;

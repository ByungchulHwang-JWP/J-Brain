const ShellPage = ({ title, eyebrow, description, statusItems = [], children }) => {
  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>{eyebrow || 'JWP Intent Factory'}</span> {'>'} <span>{title}</span>
      </div>

      <div className="page-header" style={{ padding: '12px 0 20px', margin: 0 }}>
        <h2 style={{ fontWeight: 600 }}>{title}</h2>
        {description && (
          <p style={{ margin: '8px 0 0', color: 'var(--color-text-sub)', fontSize: '14px' }}>
            {description}
          </p>
        )}
      </div>

      {statusItems.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: '20px' }}>
          {statusItems.map((item) => (
            <div className="stat-card" key={item.label}>
              <div className="stat-card-label">{item.label}</div>
              <div className="stat-card-value">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="table-area" style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  );
};

export default ShellPage;

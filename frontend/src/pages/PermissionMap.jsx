import React from 'react';

const mockMenus = [
  { id: 1, name: '대시보드 (상위)', isParent: true },
  { id: 5, name: '운영 현황', isParent: false },
  { id: 6, name: '사용 통계', isParent: false },
  { id: 2, name: '지식 관리 (상위)', isParent: true },
  { id: 7, name: '문서(Source) 목록', isParent: false },
  { id: 8, name: '인덱싱 작업 현황', isParent: false },
];

const PermissionMap = () => {
  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>권한 관리</span> {'>'} <span>메뉴-권한 매핑</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>메뉴-권한(Role) 매핑 설정</h2>
        <button className="btn-primary" onClick={() => alert('매핑 정보가 저장되었습니다.')}>변경사항 저장</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '24px' }}>
        <p style={{ margin: '0 0 24px', color: '#666', fontSize: '14px' }}>
          각 역할(Role)별로 접근 가능한 메뉴(읽기/쓰기 권한)를 제어합니다. 하위 메뉴 권한을 부여하려면 상위 메뉴 권한이 반드시 필요합니다.
        </p>
        
        <table className="table-area" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: '30%', textAlign: 'left', paddingLeft: '24px' }}>메뉴명</th>
              <th style={{ width: '35%', textAlign: 'center' }}>ROLE_ADMIN (관리자)</th>
              <th style={{ width: '35%', textAlign: 'center' }}>ROLE_USER (일반 사용자)</th>
            </tr>
          </thead>
          <tbody>
            {mockMenus.map(m => (
              <tr key={m.id} style={{ background: m.isParent ? '#f8f9fa' : '#fff' }}>
                <td style={{ fontWeight: m.isParent ? 600 : 400, paddingLeft: m.isParent ? '24px' : '48px', color: m.isParent ? '#333' : '#666' }}>
                  {m.isParent ? '📁 ' : '📄 '} {m.name}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked /> 허용
                  </label>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked={m.isParent || m.name === '사용 통계'} /> 허용
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionMap;

import React from 'react';

const mockUsers = [
  { id: 1, email: 'admin@kt.com', name: '시스템 관리자', role: 'ROLE_ADMIN', status: '활성', last_login: '2026-06-22 09:00' },
  { id: 2, email: 'user1@kt.com', name: '일반 사용자 1', role: 'ROLE_USER', status: '활성', last_login: '2026-06-21 14:30' },
  { id: 3, email: 'user2@kt.com', name: '일반 사용자 2', role: 'ROLE_USER', status: '대기', last_login: '-' },
];

const UserList = () => {
  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>권한 관리</span> {'>'} <span>계정 목록</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 600 }}>계정 (User) 목록</h2>
        <button className="btn-primary">+ 신규 계정 등록</button>
      </div>

      <div className="table-area">
        <table>
          <thead>
            <tr>
              <th>이메일 (ID)</th>
              <th>이름</th>
              <th>권한 (Role)</th>
              <th>상태</th>
              <th>최근 로그인</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.email}</td>
                <td>{u.name}</td>
                <td><span style={{ background: u.role === 'ROLE_ADMIN' ? '#eef4ff' : '#f8f9fa', color: u.role === 'ROLE_ADMIN' ? '#3069B3' : '#666', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{u.role}</span></td>
                <td>
                  <span className={`badge ${u.status === '활성' ? 'active' : 'warning'}`}>{u.status}</span>
                </td>
                <td>{u.last_login}</td>
                <td>
                  <button className="btn-table">수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;

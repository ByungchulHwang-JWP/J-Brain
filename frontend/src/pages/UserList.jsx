import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from '../components/common/Loader';
import Pagination from '../components/common/Pagination';

const ROLES = ['ROLE_ADMIN', 'ROLE_USER'];
const STATUS_OPTIONS = ['approved', 'pending', 'rejected'];
const STATUS_LABEL = { approved: '활성', pending: '대기', rejected: '거부' };

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('ROLE_ADMIN');
  const [newDept, setNewDept] = useState('');

  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);

  const token = () => localStorage.getItem('ai_access_token');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/users', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('계정 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!newEmail.trim() || !newName.trim()) {
      toast.error('이메일과 이름을 모두 입력해주세요.');
      return;
    }
    try {
      await axios.post('/api/v1/users', {
        email: newEmail.trim(),
        name: newName.trim(),
        role_id: newRole,
        department: newDept.trim()
      }, { headers: { Authorization: `Bearer ${token()}` } });
      setIsNewModalOpen(false);
      setNewEmail(''); setNewName(''); setNewRole('ROLE_ADMIN'); setNewDept('');
      fetchUsers();
    } catch (err) {
      toast.error('생성에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditName(u.name);
    setEditRole(u.role_id);
    setEditDept(u.department || '');
    setEditStatus(u.approval_status);
  };

  const handleUpdate = async () => {
    try {
      await axios.patch(`/api/v1/users/${editUser.id}`, {
        name: editName,
        role_id: editRole,
        department: editDept,
        approval_status: editStatus,
      }, { headers: { Authorization: `Bearer ${token()}` } });
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error('수정에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/v1/users/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error('삭제에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    if (aVal === undefined || aVal === null || aVal === '-') aVal = '';
    if (bVal === undefined || bVal === null || bVal === '-') bVal = '';

    if (aVal < bVal) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>권한 관리</span> {'>'} <span>계정 목록</span>
      </div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700 }}>계정 (User) 목록</h2>
        <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>+ 신규 계정 등록</button>
      </div>

      <div className="table-area">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                이메일 (ID) {sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                이름 {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
                부서 {sortConfig.key === 'department' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('role_id')} style={{ cursor: 'pointer' }}>
                권한 (Role) {sortConfig.key === 'role_id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('approval_status')} style={{ cursor: 'pointer' }}>
                상태 {sortConfig.key === 'approval_status' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('last_login_at')} style={{ cursor: 'pointer' }}>
                최근 로그인 {sortConfig.key === 'last_login_at' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (<tr key={idx}><td><Skeleton width="100px" /></td><td><Skeleton width="120px" /></td><td><Skeleton width="180px" /></td><td><Skeleton width="80px" /></td><td><Skeleton width="150px" /></td><td><Skeleton width="120px" /></td><td><Skeleton width="80px" /></td></tr>))
            ) : displayedUsers.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>등록된 계정이 없습니다.</td></tr>
            ) : displayedUsers.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{u.email}</td>
                <td style={{ color: 'var(--color-text-main)' }}>{u.name}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{u.department || '-'}</td>
                <td>
                  <span className={`role-badge ${u.role_id === 'ROLE_ADMIN' ? 'admin' : 'user'}`}>
                    {u.role_id}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.approval_status === 'approved' ? 'active' : u.approval_status === 'rejected' ? 'error' : 'warning'}`}>
                    {STATUS_LABEL[u.approval_status] || u.approval_status}
                  </span>
                </td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{u.last_login_at}</td>
                <td style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-table" onClick={() => openEdit(u)}>수정</button>
                  <button className="btn-table" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-border)' }} onClick={() => setDeleteTarget(u)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!loading && users.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* 신규 등록 모달 */}
      {isNewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: '420px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>신규 계정 등록</h3>
            <div style={{ marginBottom: '14px' }}>
              <label className="modal-label">이메일 (ID) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" className="modal-input" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="modal-label">이름 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="사용자 이름" className="modal-input" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="modal-label">부서</label>
              <input type="text" value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="예: 개발팀" className="modal-input" />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="modal-label">권한</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="modal-select">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" style={{ height: '40px', padding: '0 20px' }} onClick={() => setIsNewModalOpen(false)}>취소</button>
              <button className="btn-primary" style={{ height: '40px', padding: '0 20px' }} onClick={handleCreate}>등록하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: '420px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '4px', fontWeight: 700, color: 'var(--color-text-main)' }}>계정 수정</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '20px' }}>{editUser.email}</p>
            <div style={{ marginBottom: '14px' }}>
              <label className="modal-label">이름</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="modal-input" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="modal-label">부서</label>
              <input type="text" value={editDept} onChange={e => setEditDept(e.target.value)} className="modal-input" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="modal-label">권한</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)} className="modal-select">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="modal-label">승인 상태</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="modal-select">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" style={{ height: '40px', padding: '0 20px' }} onClick={() => setEditUser(null)}>취소</button>
              <button className="btn-primary" style={{ height: '40px', padding: '0 20px' }} onClick={handleUpdate}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: '360px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--color-text-main)' }}>계정 삭제</h3>
            <p style={{ color: 'var(--color-text-sub)', fontSize: '14px', marginBottom: '24px' }}>
              <strong>[{deleteTarget.name}]</strong> ({deleteTarget.email}) 계정을 삭제하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-secondary" style={{ height: '40px', padding: '0 24px' }} onClick={() => setDeleteTarget(null)}>취소</button>
              <button className="btn-danger" style={{ height: '40px', padding: '0 24px' }} onClick={handleDelete}>삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;

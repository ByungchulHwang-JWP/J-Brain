import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner } from '../components/common/Loader';

const PermissionMap = () => {
  const [roles, setRoles] = useState([]);
  const [parentMenus, setParentMenus] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem('ai_access_token');
  const renderScopeBadge = (scope) => {
    const isSystem = scope === 'system';
    return (
      <span
        className={`badge ${isSystem ? 'inactive' : 'active'}`}
        style={{ marginLeft: '8px', fontSize: '11px', verticalAlign: 'middle' }}
      >
        {isSystem ? 'System' : 'Project'}
      </span>
    );
  };

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/permissions', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setRoles(res.data.roles);
      setParentMenus(res.data.parent_menus);
      setMenus(res.data.menus);
    } catch (err) {
      console.error(err);
      toast.error('권한 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = (menuId, roleId, type) => {
    setMenus(prev => prev.map(m => {
      if (m.id === menuId) {
        const p = m.permissions[roleId] || { can_read: false, can_write: false };
        return {
          ...m,
          permissions: {
            ...m.permissions,
            [roleId]: { ...p, [type]: !p[type] }
          }
        };
      }
      return m;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = [];
      menus.forEach(m => {
        Object.entries(m.permissions).forEach(([roleId, perms]) => {
          payload.push({
            role_id: roleId,
            menu_id: m.id,
            can_read: perms.can_read,
            can_write: perms.can_write
          });
        });
      });

      await axios.patch('/api/v1/permissions', { permissions: payload }, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      toast.success('권한 매핑 정보가 저장되었습니다.');
      fetchPermissions();
    } catch (err) {
      console.error(err);
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="inner" style={{ padding: '60px', textAlign: 'center' }}><Spinner size={32} color="var(--color-primary)" /><p style={{marginTop: 16, color: 'var(--color-text-muted)'}}>권한 맵을 불러오는 중입니다...</p></div>;

  return (
    <div className="inner" style={{ paddingBottom: '60px' }}>
      <div className="breadcrumb">
        <span>권한 관리</span> {'>'} <span>메뉴-권한 매핑</span>
      </div>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 20px', margin: '0' }}>
        <h2 style={{ fontWeight: 700 }}>메뉴별 접근 권한 설정</h2>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '변경사항 저장'}
        </button>
      </div>

      <div className="perm-table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)' }}>
              <th rowSpan={2} style={{ padding: '13px 20px', borderRight: '1px solid var(--color-border)', width: '30%', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '12px' }}>메뉴명</th>
              {roles.map(r => (
                <th key={r.id} colSpan={2} style={{ padding: '13px 20px', borderRight: '1px solid var(--color-border)', color: 'var(--color-text-sub)', fontWeight: 600, fontSize: '13px' }}>
                  {r.name} ({r.id})
                </th>
              ))}
            </tr>
            <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)', fontSize: '12px' }}>
              {roles.map(r => (
                <React.Fragment key={r.id}>
                  <th style={{ padding: '10px 16px', borderRight: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Read (조회)</th>
                  <th style={{ padding: '10px 16px', borderRight: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Write (수정)</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {parentMenus.map(pm => {
              const children = menus.filter(m => m.parent_id === pm.id);
              return (
                <React.Fragment key={pm.id}>
                  <tr className="perm-table-group-row">
                    <td colSpan={1 + roles.length * 2} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-main)', fontSize: '14px' }}>
                      📂 {pm.name}
                      {renderScopeBadge(pm.scope)}
                    </td>
                  </tr>
                  {children.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 20px', textAlign: 'left', paddingLeft: '40px', borderRight: '1px solid var(--color-border)' }}>
                        <span style={{ color: 'var(--color-text-sub)' }}>└ {m.name}</span>
                        {renderScopeBadge(m.scope)}
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginLeft: '8px' }}>{m.url}</span>
                      </td>
                      {roles.map(r => {
                        const p = m.permissions[r.id] || { can_read: false, can_write: false };
                        return (
                          <React.Fragment key={r.id}>
                            <td style={{ padding: '12px', borderRight: '1px solid var(--color-border)' }}>
                              <input 
                                type="checkbox" 
                                checked={p.can_read} 
                                onChange={() => handleToggle(m.id, r.id, 'can_read')}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                              />
                            </td>
                            <td style={{ padding: '12px', borderRight: '1px solid var(--color-border)' }}>
                              <input 
                                type="checkbox" 
                                checked={p.can_write} 
                                onChange={() => handleToggle(m.id, r.id, 'can_write')}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                              />
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionMap;

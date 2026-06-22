import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Check, Edit2, Trash2, ShieldOff, ShieldCheck, X, Save } from 'lucide-react';
import './AdminPage.css';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Metric } from '../components/Metric.jsx';
import { config } from '../config.js';

const API = config.apiBaseUrl;

function authHeader() {
  const t = window.localStorage.getItem('upay.authToken');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const ROLE_COLORS = { Admin: '#123C34', Teacher: '#6B7280', Viewer: '#A68D71' };

export function AdminPage({ students, photos, activeUser }) {
  const [users, setUsers]       = useState([]);
  const [usersLoading, setUL]   = useState(true);
  const [usersError, setUE]     = useState('');
  const [editing, setEditing]   = useState(null); // { id, name, email, role }
  const [saving, setSaving]     = useState('');   // userId being saved
  const [deleting, setDeleting] = useState('');   // userId being deleted

  const readiness = [
    ['API base URL',        Boolean(config.apiBaseUrl)],
    ['Google OAuth client', Boolean(config.googleClientId)],
    ['Cloudinary uploads',  Boolean(config.cloudName && config.uploadPreset)],
  ];

  const loadUsers = useCallback(async () => {
    setUL(true); setUE('');
    try {
      const res  = await fetch(`${API}/users`, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load users.');
      setUsers(data);
    } catch (e) { setUE(e.message); }
    finally { setUL(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleRoleChange = async (id, role) => {
    setSaving(id);
    try {
      const res  = await fetch(`${API}/users/${id}/role`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: data.role } : u));
    } catch (e) { alert(e.message); }
    finally { setSaving(''); }
  };

  const handleBlock = async (id) => {
    setSaving(id);
    try {
      const res  = await fetch(`${API}/users/${id}/block`, { method: 'PATCH', headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBlocked: data.isBlocked } : u));
    } catch (e) { alert(e.message); }
    finally { setSaving(''); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res  = await fetch(`${API}/users/${id}`, { method: 'DELETE', headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (e) { alert(e.message); }
    finally { setDeleting(''); }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(editing.id);
    try {
      const res  = await fetch(`${API}/users/${editing.id}/details`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ name: editing.name, email: editing.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers((prev) => prev.map((u) => u._id === editing.id ? { ...u, name: data.name, email: data.email } : u));
      setEditing(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(''); }
  };

  return (
    <section className="section">
      <div className="container page-hero with-action">
        <span className="eyebrow">Admin Panel</span>
        <div>
          <h2>System infrastructure, integration status, and user management.</h2>
          <p>Manage users, audit environment status, and view database health.</p>
        </div>
      </div>

      <div className="container admin-grid">
        <div className="chart-card">
          <h3>Attendance trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[
              { month: 'Feb', value: 44 }, { month: 'Mar', value: 51 },
              { month: 'Apr', value: 58 }, { month: 'May', value: 62 },
              { month: 'Jun', value: 67 }
            ]}>
              <XAxis dataKey="month" /><YAxis /><Tooltip />
              <Area type="monotone" dataKey="value" stroke="#97B3AE" fill="#D2E0D3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="readiness-card">
          <h3>Environment readiness</h3>
          {readiness.map(([label, ok]) => (
            <div className="readiness-row" key={label}>
              {ok ? <Check /> : <AlertCircle />}
              <span>{label}</span>
              <strong>{ok ? 'Ready' : 'Missing'}</strong>
            </div>
          ))}
          <p>Signed in as: {activeUser ? `${activeUser.name} (${activeUser.role})` : 'public visitor'}</p>
        </div>

        <Metric value={students.length} label="students in system" />
        <Metric value={photos.length}   label="activity uploads" />
      </div>

      {/* ── User Management ── */}
      <div className="container" style={{ marginTop: '2.5rem' }}>
        <div className="user-mgmt-header">
          <div>
            <span className="eyebrow">Access Control</span>
            <h3 className="user-mgmt-title">User Management</h3>
          </div>
          <button className="secondary-button" onClick={loadUsers} type="button" style={{ minHeight: 36, fontSize: '0.8rem' }}>
            Refresh
          </button>
        </div>

        {usersLoading && <p className="users-state">Loading users…</p>}
        {usersError  && <p className="users-state error">{usersError}</p>}

        {!usersLoading && !usersError && (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={5} className="users-empty">No users found.</td></tr>
                )}
                {users.map((user) => {
                  const isMe       = user._id === activeUser?._id || user.email === activeUser?.email;
                  const isSaving   = saving === user._id;
                  const isDeleting = deleting === user._id;
                  const isEditing  = editing?.id === user._id;

                  return (
                    <tr key={user._id} className={user.isBlocked ? 'row-blocked' : ''}>
                      <td>
                        {isEditing ? (
                          <input className="inline-edit" value={editing.name} onChange={(e) => setEditing((v) => ({ ...v, name: e.target.value }))} />
                        ) : (
                          <span className="user-name">{user.name}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="inline-edit" type="email" value={editing.email} onChange={(e) => setEditing((v) => ({ ...v, email: e.target.value }))} />
                        ) : (
                          <span className="user-email">{user.email}</span>
                        )}
                      </td>
                      <td>
                        <select
                          className="role-select"
                          value={user.role}
                          disabled={isSaving || isMe}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          style={{ color: ROLE_COLORS[user.role] }}
                        >
                          <option value="Viewer">Viewer</option>
                          <option value="Teacher">Teacher / Volunteer</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          {isEditing ? (
                            <>
                              <button className="act-btn save"    onClick={saveEdit}           title="Save" disabled={isSaving}><Save size={14} /></button>
                              <button className="act-btn cancel"  onClick={() => setEditing(null)} title="Cancel"><X size={14} /></button>
                            </>
                          ) : (
                            <button className="act-btn edit" onClick={() => setEditing({ id: user._id, name: user.name, email: user.email })} title="Edit details" disabled={isSaving}>
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button
                            className={`act-btn ${user.isBlocked ? 'unblock' : 'block'}`}
                            onClick={() => handleBlock(user._id)}
                            title={user.isBlocked ? 'Unblock' : 'Block'}
                            disabled={isSaving || isMe}
                          >
                            {user.isBlocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                          </button>
                          <button
                            className="act-btn delete"
                            onClick={() => handleDelete(user._id)}
                            title="Delete user"
                            disabled={isDeleting || isMe}
                          >
                            {isDeleting ? '…' : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

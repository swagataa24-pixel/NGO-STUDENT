import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Check, Trash2, ShieldOff, ShieldCheck } from 'lucide-react';
import './AdminPage.css';
import { Metric } from '../components/Metric.jsx';
import { config } from '../config.js';
import { apiRequest } from '../utils/api.js';

const ROLE_COLORS = { Admin: '#123C34', Teacher: '#6B7280', Viewer: '#A68D71' };

const healthUrl = `${config.apiBaseUrl.replace(/\/api\/?$/, '')}/api/health`;

export function AdminPage({ students, classes, volunteers, photos, activeUser, dataStatus, refreshData }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [saving, setSaving] = useState('');
  const [deleting, setDeleting] = useState('');
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState('');

  const loadHealth = useCallback(async () => {
    setHealthError('');
    try {
      const response = await fetch(healthUrl);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Health check failed.');
      setHealth(data);
    } catch (error) {
      setHealth(null);
      setHealthError(error.message);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const data = await apiRequest(config.apiRoutes.users);
      setUsers(data);
    } catch (error) {
      setUsersError(error.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadHealth();
  }, [loadUsers, loadHealth]);

  const handleRoleChange = async (id, role) => {
    setSaving(id);
    try {
      const data = await apiRequest(`${config.apiRoutes.users}/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
      setUsers((prev) => prev.map((user) => (user._id === id ? { ...user, role: data.role } : user)));
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving('');
    }
  };

  const handleBlock = async (id) => {
    setSaving(id);
    try {
      const data = await apiRequest(`${config.apiRoutes.users}/${id}/block`, { method: 'PATCH' });
      setUsers((prev) => prev.map((user) => (user._id === id ? { ...user, isBlocked: data.isBlocked } : user)));
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await apiRequest(`${config.apiRoutes.users}/${id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      alert(error.message);
    } finally {
      setDeleting('');
    }
  };

  const readiness = health?.readiness
    ? [
        ['MongoDB', health.readiness.mongo],
        ['Google OAuth', health.readiness.googleOAuth],
        ['Cloudinary', health.readiness.cloudinary],
        ['JWT auth', health.readiness.jwt]
      ]
    : [];

  const refreshAll = () => {
    loadUsers();
    loadHealth();
    refreshData?.();
  };

  return (
    <section className="section">
      <div className="container page-hero with-action">
        <div>
          <span className="eyebrow">Admin Panel</span>
          <h2>User Management and Live System Overview</h2>
          <p>Manage accounts, roles, and access. Metrics below are loaded from the backend database.</p>
        </div>
        <button className="secondary-button" type="button" onClick={refreshAll} style={{ minHeight: 36, fontSize: '0.8rem' }}>
          Refresh all
        </button>
      </div>

      {(dataStatus?.loading || dataStatus?.error) && (
        <div className="container data-status-row">
          <span className={dataStatus?.error ? 'data-status error' : 'data-status'}>
            {dataStatus?.loading ? 'Loading MongoDB records...' : dataStatus?.error}
          </span>
        </div>
      )}

      <div className="container admin-metrics-grid">
        <Metric value={students.length} label="students in system" />
        <Metric value={classes.length} label="classes in system" />
        <Metric value={volunteers.length} label="volunteers in system" />
        <Metric value={photos.length} label="activity uploads" />
      </div>

      <div className="container admin-status-grid">
        <div className="readiness-card">
          <h3>Backend status</h3>
          {healthError && <p className="users-state error">{healthError}</p>}
          {!healthError && !readiness.length && <p className="users-state">Checking API health...</p>}
          {readiness.map(([label, ok]) => (
            <div className="readiness-row" key={label}>
              {ok ? <Check /> : <AlertCircle />}
              <span>{label}</span>
              <strong>{ok ? 'Ready' : 'Missing'}</strong>
            </div>
          ))}
          <p>Signed in as: {activeUser ? `${activeUser.name} (${activeUser.role})` : 'public visitor'}</p>
        </div>
      </div>

      <div className="container admin-users-section">
        <div className="user-mgmt-header">
          <div>
            <span className="eyebrow">Access Control</span>
            <h3 className="user-mgmt-title">User Management</h3>
          </div>
          <button className="secondary-button" onClick={loadUsers} type="button" style={{ minHeight: 36, fontSize: '0.8rem' }}>
            Refresh users
          </button>
        </div>

        {usersLoading && <p className="users-state">Loading users from backend...</p>}
        {usersError && (
          <p className="users-state error">
            {usersError}
            {usersError.toLowerCase().includes('authentication') && ' Sign out and sign in again to refresh your session token.'}
          </p>
        )}

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
                  <tr>
                    <td colSpan={5} className="users-empty">
                      No users found in the database.
                    </td>
                  </tr>
                )}
                {users.map((user) => {
                  const isMe = user._id === activeUser?.id || user._id === activeUser?._id || user.email === activeUser?.email;
                  const isSaving = saving === user._id;
                  const isDeleting = deleting === user._id;

                  return (
                    <tr key={user._id} className={user.isBlocked ? 'row-blocked' : ''}>
                      <td>
                        <span className="user-name">{user.name}</span>
                      </td>
                      <td>
                        <span className="user-email">{user.email}</span>
                      </td>
                      <td>
                        <select
                          className="role-select"
                          value={user.role}
                          disabled={isSaving || isMe}
                          onChange={(event) => handleRoleChange(user._id, event.target.value)}
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
                          <button
                            className={`act-btn ${user.isBlocked ? 'unblock' : 'block'}`}
                            onClick={() => handleBlock(user._id)}
                            title={user.isBlocked ? 'Unblock' : 'Block'}
                            disabled={isSaving || isMe}
                            type="button"
                          >
                            {user.isBlocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                          </button>
                          <button
                            className="act-btn delete"
                            onClick={() => handleDelete(user._id)}
                            title="Delete user"
                            disabled={isDeleting || isMe}
                            type="button"
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

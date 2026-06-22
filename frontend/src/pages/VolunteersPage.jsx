import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Pencil, Plus, RefreshCw, Save, Search, Trash2, Users, X } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import './VolunteersPage.css';
import { config } from '../config.js';
import { apiRequest, mongoId } from '../utils/api.js';

const ROLE_OPTIONS = ['Volunteer Educator', 'Center Coordinator', 'Program Lead', 'Support Volunteer'];
const AVAILABILITY_OPTIONS = ['Weekdays', 'Weekends', 'Evenings', 'Flexible', 'Mon–Wed–Fri', 'Sat–Sun'];

const emptyVolunteer = {
  name: '',
  email: '',
  phone: '',
  role: 'Volunteer Educator',
  assignedCenter: '',
  availability: 'Weekdays'
};

function volunteerHours(volunteer) {
  if (Number.isFinite(Number(volunteer?.hours))) return Number(volunteer.hours);
  return (volunteer?.activityLogs || []).reduce((sum, item) => sum + (Number(item?.hours) || 0), 0);
}

function matchesTeacher(classItem, volunteerName) {
  const teacher = String(classItem?.teacher || '').trim().toLowerCase();
  const name = String(volunteerName || '').trim().toLowerCase();
  return Boolean(teacher && name && teacher === name);
}

function isErrorState(message) {
  return /fail|error|required|permission|authentication|invalid|network/i.test(message || '');
}

export function VolunteersPage({
  volunteers = [],
  setVolunteers,
  students = [],
  classes = [],
  dataStatus,
  refreshData
}) {
  const [query, setQuery] = useState('');
  const [panelMode, setPanelMode] = useState('empty');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [form, setForm] = useState(emptyVolunteer);
  const [editingId, setEditingId] = useState(null);
  const [saveState, setSaveState] = useState('');

  const centerOptions = useMemo(() => {
    const centers = new Set([config.defaultCenter]);
    classes.forEach((item) => {
      if (item.center) centers.add(item.center);
      if (item.centerId) centers.add(item.centerId);
    });
    volunteers.forEach((item) => {
      if (item.assignedCenter) centers.add(item.assignedCenter);
    });
    return [...centers].filter(Boolean).sort();
  }, [classes, volunteers]);

  const filteredVolunteers = useMemo(
    () =>
      volunteers.filter((volunteer) =>
        [volunteer.name, volunteer.email, volunteer.role, volunteer.assignedCenter, volunteer.phone]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [volunteers, query]
  );

  const selectedVolunteer = volunteers.find((item) => mongoId(item) === selectedVolunteerId);

  const volunteerClasses = useMemo(() => {
    if (!selectedVolunteer) return [];
    return classes.filter((classItem) => matchesTeacher(classItem, selectedVolunteer.name));
  }, [classes, selectedVolunteer]);

  const volunteerStudents = useMemo(() => {
    if (!selectedVolunteer) return [];
    const classNames = new Set(volunteerClasses.map((item) => item.name));
    return students.filter((student) => classNames.has(student.className));
  }, [students, volunteerClasses, selectedVolunteer]);

  const resetForm = () => {
    setForm(emptyVolunteer);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setSelectedVolunteerId(null);
    setPanelMode('create');
    setSaveState('');
  };

  const openView = (volunteerId) => {
    setSelectedVolunteerId(volunteerId);
    setPanelMode('view');
    setSaveState('');
    resetForm();
  };

  const openEdit = (volunteer) => {
    const id = mongoId(volunteer);
    setEditingId(id);
    setSelectedVolunteerId(id);
    setPanelMode('edit');
    setForm({
      name: volunteer.name || '',
      email: volunteer.email || '',
      phone: volunteer.phone || '',
      role: volunteer.role || 'Volunteer Educator',
      assignedCenter: volunteer.assignedCenter || volunteer.center || config.defaultCenter,
      availability: volunteer.availability || 'Weekdays'
    });
    setSaveState('');
  };

  const cancelPanel = () => {
    if (selectedVolunteerId) {
      setPanelMode('view');
    } else {
      setPanelMode('empty');
    }
    resetForm();
    setSaveState('');
  };

  const saveVolunteer = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setSaveState('Volunteer name is required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role.trim() || 'Volunteer Educator',
      assignedCenter: form.assignedCenter.trim() || config.defaultCenter,
      availability: form.availability.trim() || 'Weekdays'
    };

    setSaveState(editingId ? 'Updating volunteer...' : 'Creating volunteer...');
    try {
      const saved = editingId
        ? await apiRequest(`${config.apiRoutes.volunteers}/${editingId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        : await apiRequest(config.apiRoutes.volunteers, {
            method: 'POST',
            body: JSON.stringify(payload)
          });

      setVolunteers((items) =>
        editingId ? items.map((item) => (mongoId(item) === editingId ? saved : item)) : [saved, ...items]
      );
      setSelectedVolunteerId(mongoId(saved));
      setPanelMode('view');
      resetForm();
      setSaveState(editingId ? 'Volunteer updated successfully.' : 'Volunteer created successfully.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  const deleteVolunteer = async (volunteerId) => {
    if (!window.confirm('Delete this volunteer record? This cannot be undone.')) return;
    setSaveState('Deleting volunteer...');
    try {
      await apiRequest(`${config.apiRoutes.volunteers}/${volunteerId}`, { method: 'DELETE' });
      setVolunteers((items) => items.filter((item) => mongoId(item) !== volunteerId));
      if (selectedVolunteerId === volunteerId) {
        setSelectedVolunteerId(null);
        setPanelMode('empty');
      }
      resetForm();
      setSaveState('Volunteer deleted successfully.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  const renderForm = (title) => (
    <form className="soft-card volunteer-panel-card volunteer-form-panel" onSubmit={saveVolunteer}>
      <div className="volunteer-panel-header">
        <div>
          <span className="eyebrow">{editingId ? 'Edit record' : 'New record'}</span>
          <h3>{title}</h3>
        </div>
        <button className="icon-button panel-close" type="button" onClick={cancelPanel} aria-label="Close form">
          <X size={18} />
        </button>
      </div>

      <div className="volunteer-form-grid">
        <label>
          <span>Full name *</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Priya Sharma"
            required
            autoFocus
          />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="name@example.com"
          />
        </label>
        <label>
          <span>Phone</span>
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="+91 98765 43210"
          />
        </label>
        <label>
          <span>Role</span>
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Assigned center</span>
          <select
            value={form.assignedCenter || config.defaultCenter}
            onChange={(event) => setForm((current) => ({ ...current, assignedCenter: event.target.value }))}
          >
            {centerOptions.map((center) => (
              <option key={center} value={center}>
                {center}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Availability</span>
          <select
            value={form.availability}
            onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value }))}
          >
            {AVAILABILITY_OPTIONS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="form-help">
        After saving, assign this volunteer to classes on the{' '}
        <Link to={config.routes.students}>Students page</Link> by selecting them as the class teacher.
      </p>

      <div className="button-row">
        <button className="primary-button" type="submit">
          {editingId ? <Save size={18} /> : <Plus size={18} />}
          {editingId ? 'Save changes' : 'Create volunteer'}
        </button>
        <button className="secondary-button" type="button" onClick={cancelPanel}>
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <section className="section">
      <div className="container page-hero with-action">
        <div>
          <span className="eyebrow">Admin Panel</span>
          <h2>Manage Volunteers</h2>
          <p>Add and update volunteer profiles, then review the classes and students linked to each educator.</p>
        </div>
        <div className="volunteer-hero-actions">
          <label className="search-box">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, role..." />
          </label>
          <button className="secondary-button" type="button" onClick={() => refreshData?.()} disabled={dataStatus?.loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {(dataStatus?.loading || dataStatus?.error || saveState) && (
        <div className="container data-status-row">
          {dataStatus?.loading && <span className="data-status">Loading records from backend...</span>}
          {dataStatus?.error && <span className="data-status error">{dataStatus.error}</span>}
          {saveState && <span className={isErrorState(saveState) ? 'data-status error' : 'data-status success'}>{saveState}</span>}
        </div>
      )}

      <div className="container volunteer-admin-grid">
        <aside className="volunteer-sidebar">
          <div className="volunteer-list-card">
            <div className="volunteer-list-heading">
              <h3>All volunteers</h3>
              <span>{volunteers.length}</span>
            </div>
            <button className="primary-button volunteer-add-button" type="button" onClick={openCreate}>
              <Plus size={16} /> Add volunteer
            </button>

            {filteredVolunteers.map((volunteer) => {
              const id = mongoId(volunteer);
              const linkedClasses = classes.filter((classItem) => matchesTeacher(classItem, volunteer.name));
              const isActive = selectedVolunteerId === id && panelMode === 'view';
              return (
                <button
                  key={id}
                  type="button"
                  className={isActive ? 'volunteer-list-item active' : 'volunteer-list-item'}
                  onClick={() => openView(id)}
                >
                  <Users size={18} />
                  <span>
                    <strong>{volunteer.name}</strong>
                    <small>
                      {volunteer.role || 'Volunteer'} · {linkedClasses.length} class{linkedClasses.length === 1 ? '' : 'es'}
                    </small>
                  </span>
                </button>
              );
            })}

            {!filteredVolunteers.length && (
              <EmptyState
                title={query ? 'No matches found' : 'No volunteers yet'}
                text={query ? 'Try a different search term.' : 'Click "Add volunteer" to create the first profile.'}
              />
            )}
          </div>
        </aside>

        <div className="volunteer-workspace">
          {panelMode === 'create' && renderForm('Create volunteer')}
          {panelMode === 'edit' && selectedVolunteer && renderForm(`Edit ${selectedVolunteer.name}`)}

          {panelMode === 'view' && selectedVolunteer && (
            <>
              <article className="soft-card volunteer-panel-card volunteer-summary-card">
                <div className="volunteer-panel-header">
                  <div>
                    <span className="eyebrow">Volunteer profile</span>
                    <h3>{selectedVolunteer.name}</h3>
                    <p>
                      {selectedVolunteer.role || 'Volunteer Educator'} · {selectedVolunteer.assignedCenter || 'Unassigned center'}
                    </p>
                  </div>
                  <div className="volunteer-panel-actions">
                    <button className="secondary-button" type="button" onClick={() => openEdit(selectedVolunteer)}>
                      <Pencil size={16} /> Edit
                    </button>
                    <button className="secondary-button danger-button" type="button" onClick={() => deleteVolunteer(mongoId(selectedVolunteer))}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>

                <div className="volunteer-summary-stats">
                  <div>
                    <strong>{volunteerHours(selectedVolunteer)}h</strong>
                    <span>Logged hours</span>
                  </div>
                  <div>
                    <strong>{volunteerClasses.length}</strong>
                    <span>Classes</span>
                  </div>
                  <div>
                    <strong>{volunteerStudents.length}</strong>
                    <span>Students</span>
                  </div>
                </div>

                <div className="volunteer-contact-grid">
                  <div>
                    <span>Email</span>
                    <strong>{selectedVolunteer.email || '—'}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{selectedVolunteer.phone || '—'}</strong>
                  </div>
                  <div>
                    <span>Availability</span>
                    <strong>{selectedVolunteer.availability || '—'}</strong>
                  </div>
                </div>
              </article>

              <div className="volunteer-detail-grid">
                <section className="soft-card volunteer-detail-card">
                  <div className="detail-card-heading">
                    <BookOpen size={18} />
                    <h4>Assigned classes</h4>
                    <span>{volunteerClasses.length}</span>
                  </div>
                  {volunteerClasses.length ? (
                    <div className="detail-table-wrap">
                      <table className="detail-table">
                        <thead>
                          <tr>
                            <th>Class</th>
                            <th>Center</th>
                            <th>Schedule</th>
                            <th>Students</th>
                          </tr>
                        </thead>
                        <tbody>
                          {volunteerClasses.map((classItem) => {
                            const count = students.filter((student) => student.className === classItem.name).length;
                            return (
                              <tr key={mongoId(classItem)}>
                                <td>{classItem.name}</td>
                                <td>{classItem.center || classItem.centerId || '—'}</td>
                                <td>{classItem.schedule || '—'}</td>
                                <td>{count}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="detail-empty">
                      No classes linked yet. Go to the{' '}
                      <Link to={config.routes.students}>Students page</Link> and set{' '}
                      <strong>{selectedVolunteer.name}</strong> as the teacher when creating or editing a class.
                    </p>
                  )}
                </section>

                <section className="soft-card volunteer-detail-card">
                  <div className="detail-card-heading">
                    <GraduationCap size={18} />
                    <h4>Students under this volunteer</h4>
                    <span>{volunteerStudents.length}</span>
                  </div>
                  {volunteerStudents.length ? (
                    <div className="detail-table-wrap">
                      <table className="detail-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Age</th>
                            <th>Guardian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {volunteerStudents.map((student) => (
                            <tr key={mongoId(student)}>
                              <td>{student.name}</td>
                              <td>{student.className}</td>
                              <td>{student.age || '—'}</td>
                              <td>{student.guardianName || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="detail-empty">
                      Students appear here once they are enrolled in classes taught by this volunteer.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}

          {panelMode === 'empty' && (
            <div className="soft-card volunteer-panel-card volunteer-placeholder">
              <Users className="card-icon" />
              <h3>Volunteer management</h3>
              <p>Select a volunteer from the list to view their profile, classes, and students.</p>
              <button className="primary-button" type="button" onClick={openCreate}>
                <Plus size={18} /> Add your first volunteer
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

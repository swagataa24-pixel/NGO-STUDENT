import { useMemo, useState } from 'react';
import { BookOpen, GraduationCap, Pencil, Plus, Save, Search, Trash2, Users, X } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import './VolunteersPage.css';
import { config } from '../config.js';
import { apiRequest, mongoId } from '../utils/api.js';

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

export function VolunteersPage({ volunteers = [], setVolunteers, students = [], classes = [] }) {
  const [query, setQuery] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [form, setForm] = useState(emptyVolunteer);
  const [editingId, setEditingId] = useState(null);
  const [saveState, setSaveState] = useState('');

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

  const startCreate = () => {
    resetForm();
    setSelectedVolunteerId(null);
  };

  const startEdit = (volunteer) => {
    const id = mongoId(volunteer);
    setEditingId(id);
    setSelectedVolunteerId(id);
    setForm({
      name: volunteer.name || '',
      email: volunteer.email || '',
      phone: volunteer.phone || '',
      role: volunteer.role || 'Volunteer Educator',
      assignedCenter: volunteer.assignedCenter || volunteer.center || '',
      availability: volunteer.availability || 'Weekdays'
    });
  };

  const saveVolunteer = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role.trim() || 'Volunteer Educator',
      assignedCenter: form.assignedCenter.trim(),
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
      resetForm();
      setSaveState(editingId ? 'Volunteer updated.' : 'Volunteer created.');
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
      if (selectedVolunteerId === volunteerId) setSelectedVolunteerId(null);
      if (editingId === volunteerId) resetForm();
      setSaveState('Volunteer deleted.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  return (
    <section className="section">
      <div className="container page-hero with-action">
        <div>
          <span className="eyebrow">Admin Panel</span>
          <h2>Manage volunteers, assigned classes, and student rosters.</h2>
          <p>Create, update, or remove volunteer profiles and review the classes and students linked to each educator.</p>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search volunteers" />
        </label>
      </div>

      {saveState && (
        <div className="container data-status-row">
          <span className="data-status">{saveState}</span>
        </div>
      )}

      <div className="container volunteer-admin-grid">
        <aside className="volunteer-sidebar">
          <div className="volunteer-list-card">
            <div className="volunteer-list-heading">
              <h3>Volunteers</h3>
              <span>{volunteers.length}</span>
            </div>
            <button className="primary-button volunteer-add-button" type="button" onClick={startCreate}>
              <Plus size={16} /> Add volunteer
            </button>
            {filteredVolunteers.map((volunteer) => {
              const id = mongoId(volunteer);
              const linkedClasses = classes.filter((classItem) => matchesTeacher(classItem, volunteer.name));
              return (
                <div className={selectedVolunteerId === id ? 'volunteer-row active' : 'volunteer-row'} key={id}>
                  <button className="volunteer-select-button" type="button" onClick={() => setSelectedVolunteerId(id)}>
                    <Users size={18} />
                    <span>
                      <strong>{volunteer.name}</strong>
                      <small>
                        {volunteer.role || 'Volunteer'} · {linkedClasses.length} class{linkedClasses.length === 1 ? '' : 'es'}
                      </small>
                    </span>
                  </button>
                  <div className="volunteer-row-actions">
                    <button type="button" onClick={() => startEdit(volunteer)} aria-label={`Edit ${volunteer.name}`}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => deleteVolunteer(id)} aria-label={`Delete ${volunteer.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {!filteredVolunteers.length && (
              <EmptyState title="No volunteers found" text="Add a volunteer profile to begin managing assignments." />
            )}
          </div>

          <form className="soft-card form-card volunteer-form-card" onSubmit={saveVolunteer}>
            <h3>{editingId ? 'Edit volunteer' : 'Create volunteer'}</h3>
            <label>
              <span>Name</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              <span>Phone</span>
              <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              <span>Role</span>
              <input value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} />
            </label>
            <label>
              <span>Assigned center</span>
              <input
                value={form.assignedCenter}
                onChange={(event) => setForm((current) => ({ ...current, assignedCenter: event.target.value }))}
                placeholder={config.defaultCenter}
              />
            </label>
            <label>
              <span>Availability</span>
              <input value={form.availability} onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value }))} />
            </label>
            <button className="primary-button" type="submit">
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {editingId ? 'Save changes' : 'Create volunteer'}
            </button>
            {editingId && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </form>
        </aside>

        <div className="volunteer-workspace">
          {selectedVolunteer ? (
            <>
              <article className="soft-card volunteer-summary-card">
                <div className="volunteer-summary-header">
                  <div>
                    <span className="eyebrow">Volunteer profile</span>
                    <h3>{selectedVolunteer.name}</h3>
                    <p>
                      {selectedVolunteer.role || 'Volunteer Educator'} at {selectedVolunteer.assignedCenter || 'Unassigned center'}
                    </p>
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
                      No classes are linked yet. Set the class teacher name to <strong>{selectedVolunteer.name}</strong> on the Students page.
                    </p>
                  )}
                </section>

                <section className="soft-card volunteer-detail-card">
                  <div className="detail-card-heading">
                    <GraduationCap size={18} />
                    <h4>Students</h4>
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
                    <p className="detail-empty">No students are assigned to this volunteer&apos;s classes yet.</p>
                  )}
                </section>
              </div>
            </>
          ) : (
            <div className="soft-card volunteer-placeholder">
              <Users className="card-icon" />
              <h3>Select a volunteer</h3>
              <p>Choose a volunteer from the list to review their profile, classes, and students. Use the form to create or update records.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

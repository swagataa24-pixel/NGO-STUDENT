import { useMemo, useState } from 'react';
import { BookOpen, Eye, Pencil, Plus, Save, Search, Trash2, Users, X } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import './StudentsPage.css';
import { config } from '../config.js';
import { percent } from '../utils/attendance.js';
import { apiRequest, mongoId } from '../utils/api.js';

function classNumber(className) {
  const match = String(className).match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortClassGroups(classes) {
  return [...classes].sort((a, b) => classNumber(a.name) - classNumber(b.name) || a.name.localeCompare(b.name));
}

function slug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyStudent = {
  name: '',
  age: '',
  gender: '',
  photoUrl: '',
  guardianName: '',
  guardianContact: '',
  enrollmentDate: '',
  note: ''
};

const emptyClass = {
  name: '',
  center: '',
  teacher: '',
  schedule: '',
  description: ''
};

export function StudentsPage({ students, setStudents, classes, setClasses, dataStatus, refreshData, volunteers = [] }) {
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState(classes[0] ? mongoId(classes[0]) : 'all');
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [classForm, setClassForm] = useState(emptyClass);
  const [editingClassId, setEditingClassId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saveState, setSaveState] = useState('');

  const sortedClasses = useMemo(() => sortClassGroups(classes), [classes]);
  const selectedClassRecord = classes.find((item) => mongoId(item) === selectedClass);
  const selectedClassName = selectedClassRecord?.name;
  const scopedStudents = students.filter((student) => selectedClass === 'all' || student.className === selectedClassName);
  const filteredStudents = scopedStudents.filter((student) =>
    [student.name, student.className, student.center, student.guardianName]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const saveClass = async (event) => {
    event.preventDefault();
    if (!classForm.name.trim()) return;
    const payload = {
      centerId: slug(classForm.center || config.defaultCenter),
      ...classForm
    };
    setSaveState('Saving class...');
    try {
      const savedClass = editingClassId
        ? await apiRequest(`${config.apiRoutes.classes}/${editingClassId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiRequest(config.apiRoutes.classes, { method: 'POST', body: JSON.stringify(payload) });
      setClasses((items) =>
        sortClassGroups(editingClassId ? items.map((item) => (mongoId(item) === editingClassId ? savedClass : item)) : [...items, savedClass])
      );
      setSelectedClass(mongoId(savedClass));
      setEditingClassId(null);
      setClassForm(emptyClass);
      setSaveState('Class saved.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  const editClass = (classItem) => {
    setEditingClassId(mongoId(classItem));
    setSelectedClass(mongoId(classItem));
    setClassForm({
      name: classItem.name || '',
      center: classItem.center || '',
      teacher: classItem.teacher || '',
      schedule: classItem.schedule || '',
      description: classItem.description || ''
    });
  };

  const deleteClass = async (classId) => {
    setSaveState('Deleting class...');
    try {
      await apiRequest(`${config.apiRoutes.classes}/${classId}`, { method: 'DELETE' });
      setClasses((items) => items.filter((item) => mongoId(item) !== classId));
      if (selectedClass === classId) setSelectedClass('all');
      setEditingClassId(null);
      setClassForm(emptyClass);
      setSaveState('Class deleted.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  const addStudent = async (event) => {
    event.preventDefault();
    const classRecord = selectedClassRecord || classes.find((item) => item.name === studentForm.className);
    if (!studentForm.name.trim() || !classRecord) return;
    const payload = {
      ...studentForm,
      photoUrl:
        studentForm.photoUrl ||
        'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=600&q=80',
      centerId: classRecord.centerId,
      center: classRecord.center,
      classId: mongoId(classRecord),
      className: classRecord.name,
      enrollmentDate: studentForm.enrollmentDate || new Date().toISOString().slice(0, 10),
      progressNotes: studentForm.note ? [{ category: 'Initial', note: studentForm.note }] : [],
      activeStatus: true,
      age: Number(studentForm.age || 0),
      note: studentForm.note || 'New student record created.'
    };
    setSaveState('Saving student...');
    try {
      const savedStudent = await apiRequest(config.apiRoutes.students, { method: 'POST', body: JSON.stringify(payload) });
      setStudents((current) => [savedStudent, ...current]);
      setStudentForm(emptyStudent);
      setSaveState('Student saved.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  const selectedStudent = students.find((student) => mongoId(student) === selectedStudentId);

  const openStudent = (student) => {
    setSelectedStudentId(mongoId(student));
    setEditingStudent(null);
  };

  const startEdit = (student) => {
    setSelectedStudentId(mongoId(student));
    setEditingStudent({
      ...student,
      age: String(student.age || ''),
      enrollmentDate: student.enrollmentDate || ''
    });
  };

  const saveStudent = async (event) => {
    event.preventDefault();
    if (!editingStudent?.name?.trim()) return;
    const classRecord = classes.find((item) => mongoId(item) === editingStudent.classId) || classes.find((item) => item.name === editingStudent.className);
    const payload = {
      ...editingStudent,
      age: Number(editingStudent.age || 0),
      classId: classRecord ? mongoId(classRecord) : editingStudent.classId,
      className: classRecord?.name || editingStudent.className,
      center: classRecord?.center || editingStudent.center,
      centerId: classRecord?.centerId || editingStudent.centerId
    };
    setSaveState('Saving student...');
    try {
      const savedStudent = await apiRequest(`/students/${mongoId(editingStudent)}`, { method: 'PUT', body: JSON.stringify(payload) });
      setStudents((items) => items.map((student) => (mongoId(student) === mongoId(savedStudent) ? savedStudent : student)));
      setEditingStudent(null);
      setSaveState('Student updated.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  const deleteStudent = async (studentId) => {
    setSaveState('Deleting student...');
    try {
      await apiRequest(`/students/${studentId}`, { method: 'DELETE' });
      setStudents((items) => items.filter((student) => mongoId(student) !== studentId));
      setSaveState('Student deleted.');
    } catch (error) {
      setSaveState(error.message);
      return;
    }
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
      setEditingStudent(null);
    }
  };

  return (
    <section className="section">
      <div className="container page-hero with-action">
        <div>
          <span className="eyebrow">Registry</span>
          <h2>Student directory, classroom rosters, and development logs.</h2>
          <p>Register classrooms, assign centers, and document student enrollment profiles to monitor longitudinal educational progress.</p>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students" />
        </label>
      </div>
      {(dataStatus?.loading || dataStatus?.error || saveState) && (
        <div className="container data-status-row">
          {(dataStatus?.loading || dataStatus?.error) && (
            <span className={dataStatus?.error ? 'data-status error' : 'data-status'}>
              {dataStatus?.loading ? 'Loading MongoDB records...' : dataStatus?.error}
            </span>
          )}
          {saveState && <span className="data-status">{saveState}</span>}
        </div>
      )}

      <div className="container student-management-grid">
        <aside className="class-manager">
          <div className="class-list-card">
            <div className="class-list-heading">
              <h3>Classes</h3>
              <span>{classes.length}</span>
            </div>
            <button className={selectedClass === 'all' ? 'class-row active' : 'class-row'} onClick={() => setSelectedClass('all')}>
              <BookOpen size={18} />
              <span>
                <strong>All classes</strong>
                <small>{students.length} students</small>
              </span>
            </button>
            {sortedClasses.map((classItem) => {
              const count = students.filter((student) => student.className === classItem.name).length;
              const classId = mongoId(classItem);
              return (
                <div className={selectedClass === classId ? 'class-row active' : 'class-row'} key={classId}>
                  <button className="class-select-button" onClick={() => setSelectedClass(classId)}>
                    <Users size={18} />
                    <span>
                      <strong>{classItem.name}</strong>
                      <small>{count} students</small>
                    </span>
                  </button>
                  <div className="class-row-actions">
                    <button onClick={() => editClass(classItem)} aria-label={`Edit ${classItem.name}`}><Pencil size={16} /></button>
                    <button onClick={() => deleteClass(classId)} aria-label={`Delete ${classItem.name}`}><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          <form className="soft-card form-card" onSubmit={saveClass}>
            <h3>{editingClassId ? 'Edit class' : 'Create class'}</h3>
            <label>
              <span>Class name</span>
              <input value={classForm.name} onChange={(event) => setClassForm((current) => ({ ...current, name: event.target.value }))} placeholder="Class 5" />
            </label>
            <label>
              <span>Teacher / Volunteer</span>
              <input
                list="volunteer-teacher-options"
                value={classForm.teacher}
                onChange={(event) => setClassForm((current) => ({ ...current, teacher: event.target.value }))}
                placeholder={volunteers.length ? 'Select or type volunteer name' : 'Teacher name'}
              />
              {volunteers.length > 0 && (
                <datalist id="volunteer-teacher-options">
                  {volunteers.map((volunteer) => (
                    <option key={mongoId(volunteer)} value={volunteer.name} />
                  ))}
                </datalist>
              )}
              {volunteers.length > 0 && (
                <small className="field-hint">Pick from registered volunteers so they appear under Manage Volunteers.</small>
              )}
            </label>
            <label>
              <span>Schedule</span>
              <input value={classForm.schedule} onChange={(event) => setClassForm((current) => ({ ...current, schedule: event.target.value }))} placeholder="Mon, Wed, Fri" />
            </label>
            <label>
              <span>Description</span>
              <input value={classForm.description} onChange={(event) => setClassForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <button className="primary-button" type="submit">
              <Plus size={18} /> {editingClassId ? 'Save class' : 'Create class'}
            </button>
            {editingClassId && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setEditingClassId(null);
                  setClassForm(emptyClass);
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </aside>

        <div className="student-workspace">
          <ClassSummary classRecord={selectedClassRecord} students={filteredStudents} allSelected={selectedClass === 'all'} />

          <form className="soft-card detailed-student-form" onSubmit={addStudent}>
            <div className="form-title-row">
              <h3>Add student {selectedClassRecord ? `to ${selectedClassRecord.name}` : ''}</h3>
              {!selectedClassRecord && <span>Select a class to add students</span>}
            </div>
            <div className="form-grid">
              <label>
                <span>Student name</span>
                <input value={studentForm.name} onChange={(event) => setStudentForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                <span>Age</span>
                <input type="number" value={studentForm.age} onChange={(event) => setStudentForm((current) => ({ ...current, age: event.target.value }))} />
              </label>
              <label>
                <span>Gender</span>
                <select value={studentForm.gender} onChange={(event) => setStudentForm((current) => ({ ...current, gender: event.target.value }))}>
                  <option value="">Select</option>
                  <option>Girl</option>
                  <option>Boy</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                <span>Enrollment date</span>
                <input type="date" value={studentForm.enrollmentDate} onChange={(event) => setStudentForm((current) => ({ ...current, enrollmentDate: event.target.value }))} />
              </label>
              <label>
                <span>Guardian name</span>
                <input value={studentForm.guardianName} onChange={(event) => setStudentForm((current) => ({ ...current, guardianName: event.target.value }))} />
              </label>
              <label>
                <span>Guardian contact</span>
                <input value={studentForm.guardianContact} onChange={(event) => setStudentForm((current) => ({ ...current, guardianContact: event.target.value }))} />
              </label>
              <label className="wide-field">
                <span>Photo URL</span>
                <input value={studentForm.photoUrl} onChange={(event) => setStudentForm((current) => ({ ...current, photoUrl: event.target.value }))} placeholder="Optional" />
              </label>
              <label className="wide-field">
                <span>Initial progress note</span>
                <input value={studentForm.note} onChange={(event) => setStudentForm((current) => ({ ...current, note: event.target.value }))} />
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={!selectedClassRecord}>
              <Plus size={18} /> Add student
            </button>
          </form>

          <div className="student-list">
            {selectedClass === 'all' ? (
              sortedClasses.map((classItem) => {
                const group = filteredStudents.filter((student) => student.className === classItem.name);
                if (!group.length) return null;
                return (
                  <ClassRoster
                    key={mongoId(classItem)}
                    className={classItem.name}
                    students={group}
                    onView={openStudent}
                    onEdit={startEdit}
                    onDelete={deleteStudent}
                  />
                );
              })
            ) : (
              <ClassRoster
                className={selectedClassName || 'Selected class'}
                students={filteredStudents}
                onView={openStudent}
                onEdit={startEdit}
                onDelete={deleteStudent}
              />
            )}
            {!filteredStudents.length && <EmptyState title="No students found" text="Create a class, add a student, or change the search." />}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          classes={classes}
          editingStudent={editingStudent}
          setEditingStudent={setEditingStudent}
          onClose={() => {
            setSelectedStudentId(null);
            setEditingStudent(null);
          }}
          onEdit={() => startEdit(selectedStudent)}
          onSave={saveStudent}
          onDelete={() => deleteStudent(mongoId(selectedStudent))}
        />
      )}
    </section>
  );
}

function ClassSummary({ classRecord, students, allSelected }) {
  const average =
    students.reduce((sum, student) => sum + percent(student), 0) / Math.max(students.length, 1);




  return (
    <div className="class-summary-card">
      <div>
        <span className="eyebrow">{allSelected ? 'All classes' : 'Class'}</span>
        <h3>{allSelected ? 'Complete student database' : classRecord?.name}</h3>
        <p>{allSelected ? 'Review all enrolled students.' : classRecord?.description}</p>
      </div>
      <div className="class-summary-stats">
        <strong>{students.length}</strong>
        <span>students</span>
      </div>
      <div className="class-summary-stats">
        <strong>{Math.round(average)}%</strong>
        <span>avg attendance</span>
      </div>
    </div>
  );
}

function ClassRoster({ className, students, onView, onEdit, onDelete }) {
  return (
    <section className="class-section">
      <div className="class-section-heading">
        <h3>{className}</h3>
        <span>{students.length} students</span>
      </div>
      <div className="student-grid">
        {students.map((student) => (
          <StudentCard
            key={mongoId(student)}
            student={student}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

function StudentCard({ student, onView, onEdit, onDelete }) {
  const value = percent(student);
  const active = student.activeStatus !== false && student.active !== false;
  const notes = student.progressNotes || student.progress || [];
  return (
    <article className={active ? 'student-card' : 'student-card archived'}>
      <img src={student.photoUrl} alt={student.name} />
      <div>
        <div className="student-title">
          <h3>{student.name}</h3>
          <StatusBadge value={value} />
        </div>
        <p>{student.className}</p>
        <small>Guardian: {student.guardianName} · {student.guardianContact}</small>
        <div className="note-list">
          {notes.slice(-2).map((note, index) => (
            <span key={`${note.category || 'note'}-${index}`}>{note.note || note}</span>
          ))}
          {student.note && <span>{student.note}</span>}
        </div>
      </div>
      <div className="student-actions">
        <button className="icon-button" aria-label={`View ${student.name}`} onClick={() => onView(student)}>
          <Eye />
        </button>
        <button className="icon-button" aria-label={`Edit ${student.name}`} onClick={() => onEdit(student)}>
          <Pencil />
        </button>
        <button className="icon-button danger-icon" aria-label={`Delete ${student.name}`} onClick={() => onDelete(mongoId(student))}>
          <Trash2 />
        </button>
      </div>
    </article>
  );
}

function StudentDetailPanel({
  student,
  classes,
  editingStudent,
  setEditingStudent,
  onClose,
  onEdit,
  onSave,
  onDelete
}) {
  const isEditing = Boolean(editingStudent);
  const data = editingStudent || student;
  const value = percent(student);
  const update = (field, val) => setEditingStudent((current) => ({ ...current, [field]: val }));
  return (
    <div className="drawer-backdrop" role="presentation">
      <aside className="student-drawer" aria-label={`${student.name} details`}>
        <div className="drawer-header">
          <div>
            <span className="eyebrow">Student detail</span>
            <h3>{student.name}</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close student detail">
            <X />
          </button>
        </div>

        <img className="drawer-photo" src={student.photoUrl} alt={student.name} />

        {isEditing ? (
          <form className="drawer-form" onSubmit={onSave}>
            <div className="drawer-summary">
              <StatusBadge value={value} />
              <p>{student.className}</p>
            </div>
            <div className="form-grid">
              <label><span>Name</span><input value={data.name} onChange={(event) => update('name', event.target.value)} /></label>
              <label><span>Age</span><input type="number" value={data.age} onChange={(event) => update('age', event.target.value)} /></label>
              <label>
                <span>Gender</span>
                <select value={data.gender || ''} onChange={(event) => update('gender', event.target.value)}>
                  <option value="">Select</option>
                  <option>Girl</option>
                  <option>Boy</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                <span>Class</span>
                <select value={data.classId || ''} onChange={(event) => update('classId', event.target.value)}>
                  {classes.map((classItem) => (
                    <option value={mongoId(classItem)} key={mongoId(classItem)}>{classItem.name}</option>
                  ))}
                </select>
              </label>
              <label><span>Enrollment date</span><input type="date" value={data.enrollmentDate || ''} onChange={(event) => update('enrollmentDate', event.target.value)} /></label>
              <label><span>Guardian</span><input value={data.guardianName || ''} onChange={(event) => update('guardianName', event.target.value)} /></label>
              <label><span>Contact</span><input value={data.guardianContact || ''} onChange={(event) => update('guardianContact', event.target.value)} /></label>
              <label className="wide-field"><span>Photo URL</span><input value={data.photoUrl || ''} onChange={(event) => update('photoUrl', event.target.value)} /></label>
              <label className="wide-field"><span>Progress note</span><input value={data.note || ''} onChange={(event) => update('note', event.target.value)} /></label>
            </div>
            <div className="button-row">
              <button className="primary-button" type="submit"><Save size={18} /> Save changes</button>
              <button className="secondary-button" type="button" onClick={() => setEditingStudent(null)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
          <div className="drawer-summary">
            <StatusBadge value={value} />
            <p>{student.className} · Enrolled {student.enrollmentDate || '-'}</p>
          </div>
          <div className="detail-grid">
            <Detail label="Class" value={student.className} />
            <Detail label="Age" value={student.age || '-'} />
            <Detail label="Gender" value={student.gender || '-'} />
            <Detail label="Guardian" value={student.guardianName || '-'} />
            <Detail label="Contact" value={student.guardianContact || '-'} />
            <Detail label="Enrollment" value={student.enrollmentDate || '-'} />
            <Detail label="Attendance" value={`${value}% (${student.attendanceStats?.attended ?? student.attended ?? 0}/${student.attendanceStats?.conducted ?? student.conducted ?? 0})`} />
            <Detail label="Latest note" value={student.note || '-'} wide />
          </div>
          </>
        )}

        {!isEditing && (
          <div className="drawer-actions">
            <button className="primary-button" onClick={onEdit}><Pencil size={18} /> Edit</button>
            <button className="danger-button" onClick={onDelete}><Trash2 size={18} /> Delete</button>
          </div>
        )}
      </aside>
    </div>
  );
}

function Detail({ label, value, wide }) {
  return (
    <div className={wide ? 'detail-item wide-field' : 'detail-item'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

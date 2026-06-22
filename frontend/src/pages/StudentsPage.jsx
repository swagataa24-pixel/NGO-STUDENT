import { useMemo, useRef, useState, useEffect } from 'react';
import { BookOpen, Camera, Eye, ImagePlus, Pencil, Plus, Save, Trash2, Users, X, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Metric } from '../components/Metric.jsx';
import './StudentsPage.css';
import { percent } from '../utils/attendance.js';
import { apiRequest, mongoId } from '../utils/api.js';
import { config } from '../config.js';

function classNumber(className) {
  const match = String(className).match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortClassGroups(classes) {
  return [...classes].sort((a, b) => classNumber(a.name) - classNumber(b.name) || a.name.localeCompare(b.name));
}

const emptyStudent = {
  name: '',
  age: '',
  gender: '',
  photoUrl: '',
  guardianName: '',
  guardianContact: ''
};

const emptyClass = {
  name: '',
  teacher: '',
  description: ''
};

export function StudentsPage({ students, setStudents, classes, setClasses, dataStatus, refreshData, volunteers = [] }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [classForm, setClassForm] = useState(emptyClass);
  const [editingClassId, setEditingClassId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saveState, setSaveState] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showEditCamera, setShowEditCamera] = useState(false);
  const videoRef = useRef(null);
  const editVideoRef = useRef(null);
  const streamRef = useRef(null);
  const editStreamRef = useRef(null);

  useEffect(() => {
    if (classId) {
      setSelectedClassId(classId);
    } else {
      setSelectedClassId(null);
    }
  }, [classId]);

  const sortedClasses = useMemo(() => sortClassGroups(classes), [classes]);
  const selectedClass = classes.find((item) => mongoId(item) === selectedClassId);
  const classStudents = students.filter((student) => student.classId === selectedClassId || student.className === selectedClass?.name);

  const handleFileUpload = (event, isEdit = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      if (isEdit) {
        setEditingStudent((prev) => ({ ...prev, photoUrl: base64 }));
      } else {
        setStudentForm((prev) => ({ ...prev, photoUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async (isEdit = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      if (isEdit) {
        editStreamRef.current = stream;
        if (editVideoRef.current) {
          editVideoRef.current.srcObject = stream;
        }
        setShowEditCamera(true);
      } else {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = (isEdit = false) => {
    const stream = isEdit ? editStreamRef.current : streamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (isEdit) {
      setShowEditCamera(false);
    } else {
      setShowCamera(false);
    }
  };

  const capturePhoto = (isEdit = false) => {
    const video = isEdit ? editVideoRef.current : videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/png');
    if (isEdit) {
      setEditingStudent((prev) => ({ ...prev, photoUrl: base64 }));
      stopCamera(true);
    } else {
      setStudentForm((prev) => ({ ...prev, photoUrl: base64 }));
      stopCamera(false);
    }
  };

  const saveClass = async (event) => {
    event.preventDefault();
    if (!classForm.name.trim()) return;
    const payload = { ...classForm };
    setSaveState('Saving class...');
    try {
      const savedClass = editingClassId
        ? await apiRequest(`${config.apiRoutes.classes}/${editingClassId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiRequest(config.apiRoutes.classes, { method: 'POST', body: JSON.stringify(payload) });
      setClasses((items) => sortClassGroups(editingClassId ? items.map((item) => (mongoId(item) === editingClassId ? savedClass : item)) : [...items, savedClass]));
      setEditingClassId(null);
      setClassForm(emptyClass);
      setSaveState('Class saved.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  const editClass = (classItem) => {
    setEditingClassId(mongoId(classItem));
    setClassForm({
      name: classItem.name || '',
      teacher: classItem.teacher || '',
      description: classItem.description || ''
    });
  };

  const deleteClass = async (classId) => {
    setSaveState('Deleting class...');
    try {
      await apiRequest(`${config.apiRoutes.classes}/${classId}`, { method: 'DELETE' });
      setClasses((items) => items.filter((item) => mongoId(item) !== classId));
      if (selectedClassId === classId) setSelectedClassId(null);
      setEditingClassId(null);
      setClassForm(emptyClass);
      setSaveState('Class deleted.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  const addStudent = async (event) => {
    event.preventDefault();
    if (!studentForm.name.trim() || !selectedClass) return;
    const payload = {
      ...studentForm,
      photoUrl: studentForm.photoUrl || 'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=600&q=80',
      centerId: selectedClass.centerId,
      classId: mongoId(selectedClass),
      className: selectedClass.name,
      activeStatus: true,
      age: Number(studentForm.age || 0)
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
      age: String(student.age || '')
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
            {selectedClass ? (
              <div className="back-button-container">
                <button className="back-button" onClick={() => navigate(config.routes.students)}>
                  <ArrowLeft size={18} /> Back to Classes
                </button>
                <span className="eyebrow">Class Detail</span>
                <h2>{selectedClass.name}</h2>
                <p>{selectedClass.description}</p>
              </div>
            ) : (
              <>
                <span className="eyebrow">Class Management</span>
                <h2>Create and Manage Classes</h2>
                <p>Create classes, then click on a class to add and manage students.</p>
              </>
            )}
          </div>
        </div>
      {(dataStatus?.loading || dataStatus?.error || saveState) && (
        <div className="container data-status-row">
          {(dataStatus?.loading || dataStatus?.error) && (
            <span className={dataStatus?.error ? 'data-status error' : 'data-status'}>
              {dataStatus?.loading ? 'Loading records...' : dataStatus?.error}
            </span>
          )}
          {saveState && <span className="data-status">{saveState}</span>}
        </div>
      )}

      <div className="container">
        {!selectedClass ? (
          <div className="classes-view">
            <div className="class-form-section">
              <form className="soft-card form-card" onSubmit={saveClass}>
                <h3>{editingClassId ? 'Edit Class' : 'Create New Class'}</h3>
                <label>
                  <span>Class Name</span>
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
                    <small className="field-hint">Pick from registered volunteers.</small>
                  )}
                </label>
                <label>
                  <span>Description</span>
                  <input value={classForm.description} onChange={(event) => setClassForm((current) => ({ ...current, description: event.target.value }))} />
                </label>
                <button className="primary-button" type="submit">
                  <Plus size={18} /> {editingClassId ? 'Save Class' : 'Create Class'}
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
            </div>
            <div className="classes-grid">
              {sortedClasses.length === 0 ? (
                <EmptyState title="No Classes Yet" text="Create your first class to get started!" />
              ) : (
                sortedClasses.map((classItem) => {
                  const count = students.filter((student) => student.className === classItem.name || student.classId === mongoId(classItem)).length;
                  return (
                    <div key={mongoId(classItem)} className="class-card" onClick={() => navigate(`${config.routes.students}/${mongoId(classItem)}`)}>
                      <div className="class-card-header">
                        <div className="class-card-icon"><Users size={24} /></div>
                        <div className="class-card-info">
                          <h3>{classItem.name}</h3>
                          {classItem.teacher && <p>{classItem.teacher}</p>}
                        </div>
                      </div>
                      {classItem.description && <p className="class-card-description">{classItem.description}</p>}
                      <div className="class-card-footer">
                        <span className="class-card-count">{count} Students</span>
                        <div className="class-card-actions">
                          <button className="icon-button" onClick={(e) => { e.stopPropagation(); editClass(classItem); }}><Pencil size={16} /></button>
                          <button className="icon-button danger-icon" onClick={(e) => { e.stopPropagation(); deleteClass(mongoId(classItem)); }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="class-detail-view">
            <div className="class-summary-card">
              <div>
                <h3>Class Overview</h3>
                {selectedClass.teacher && <p>Teacher: {selectedClass.teacher}</p>}
              </div>
              <div className="class-summary-stats">
                <strong>{classStudents.length}</strong>
                <span>Total Students</span>
              </div>
            </div>
            <div className="class-summary-card">
              <h3>Attendance Overview</h3>
              <div className="report-cards">
                {classStudents.length > 0 && (
                  <Metric
                    value={`${Math.round(classStudents.reduce((sum, s) => sum + percent(s), 0) / classStudents.length)}%`}
                    label="Overall Attendance"
                  />
                )}
                {/* Add monthly attendance here if needed */}
              </div>
            </div>
            <form className="soft-card detailed-student-form" onSubmit={addStudent}>
              <div className="form-title-row">
                <h3>Add New Student</h3>
              </div>
              <div className="form-grid">
                <label>
                  <span>Student Name</span>
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
                  <span>Guardian Name</span>
                  <input value={studentForm.guardianName} onChange={(event) => setStudentForm((current) => ({ ...current, guardianName: event.target.value }))} />
                </label>
                <label>
                  <span>Guardian Contact</span>
                  <input value={studentForm.guardianContact} onChange={(event) => setStudentForm((current) => ({ ...current, guardianContact: event.target.value }))} />
                </label>
                <label className="wide-field">
                  <span>Student Photo</span>
                  <div className="photo-upload-buttons">
                    <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, false)} />
                    <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
                      <ImagePlus size={16} /> Upload Photo
                    </button>
                    <button type="button" className="secondary-button" onClick={() => startCamera(false)}>
                      <Camera size={16} /> Take Photo
                    </button>
                  </div>
                  {studentForm.photoUrl && (
                    <div className="photo-preview">
                      <img src={studentForm.photoUrl} alt="Preview" />
                    </div>
                  )}
                </label>
              </div>
              <button className="primary-button" type="submit">
                <Plus size={18} /> Add Student
              </button>
            </form>
            <div className="students-list-section">
              <div className="class-section-heading">
                <h3>Students in {selectedClass.name}</h3>
                <span>{classStudents.length} Students</span>
              </div>
              {classStudents.length === 0 ? (
                <EmptyState title="No Students Yet" text="Add the first student to this class!" />
              ) : (
                <div className="student-grid">
                  {classStudents.map((student) => (
                    <StudentCard
                      key={mongoId(student)}
                      student={student}
                      onView={openStudent}
                      onEdit={startEdit}
                      onDelete={deleteStudent}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          classes={classes}
          editingStudent={editingStudent}
          setEditingStudent={setEditingStudent}
          onClose={() => {
            if (showEditCamera) stopCamera(true);
            setSelectedStudentId(null);
            setEditingStudent(null);
          }}
          onEdit={() => startEdit(selectedStudent)}
          onSave={saveStudent}
          onDelete={() => deleteStudent(mongoId(selectedStudent))}
          startCamera={startCamera}
          stopCamera={stopCamera}
          capturePhoto={capturePhoto}
          showEditCamera={showEditCamera}
          editVideoRef={editVideoRef}
        />
      )}

      {showCamera && (
        <div className="camera-modal">
          <div className="camera-content">
            <button className="icon-button camera-close" onClick={() => stopCamera(false)}>
              <X size={18} />
            </button>
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="camera-controls">
              <button className="primary-button camera-capture" onClick={() => capturePhoto(false)}>
                <Camera size={24} /> Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditCamera && (
        <div className="camera-modal">
          <div className="camera-content">
            <button className="icon-button camera-close" onClick={() => stopCamera(true)}>
              <X size={18} />
            </button>
            <video ref={editVideoRef} autoPlay playsInline muted />
            <div className="camera-controls">
              <button className="primary-button camera-capture" onClick={() => capturePhoto(true)}>
                <Camera size={24} /> Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
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
  onDelete,
  startCamera,
  stopCamera,
  capturePhoto,
  showEditCamera,
  editVideoRef
}) {
  const isEditing = Boolean(editingStudent);
  const data = editingStudent || student;
  const value = percent(student);
  const update = (field, val) => setEditingStudent((current) => ({ ...current, [field]: val }));
  const editFileInputRef = useRef(null);

  const handleEditFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setEditingStudent((prev) => ({ ...prev, photoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="drawer-backdrop" role="presentation">
      <aside className="student-drawer" aria-label={`${student.name} details`}>
        <div className="drawer-header">
          <div>
            <span className="eyebrow">Student Detail</span>
            <h3>{student.name}</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close student detail" type="button">
            <X size={18} />
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
              <label><span>Guardian</span><input value={data.guardianName || ''} onChange={(event) => update('guardianName', event.target.value)} /></label>
              <label><span>Contact</span><input value={data.guardianContact || ''} onChange={(event) => update('guardianContact', event.target.value)} /></label>
              <label className="wide-field">
                <span>Student Photo</span>
                <div className="photo-upload-buttons">
                  <input type="file" accept="image/*" ref={editFileInputRef} style={{ display: 'none' }} onChange={handleEditFileUpload} />
                  <button type="button" className="secondary-button" onClick={() => editFileInputRef.current?.click()}>
                    <ImagePlus size={16} /> Upload Photo
                  </button>
                  <button type="button" className="secondary-button" onClick={() => startCamera(true)}>
                    <Camera size={16} /> Take Photo
                  </button>
                </div>
                {editingStudent?.photoUrl && (
                  <div className="photo-preview">
                    <img src={editingStudent.photoUrl} alt="Preview" />
                  </div>
                )}
              </label>
            </div>
            <div className="button-row">
              <button className="primary-button" type="submit"><Save size={18} /> Save Changes</button>
              <button className="secondary-button" type="button" onClick={() => setEditingStudent(null)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="drawer-summary">
              <StatusBadge value={value} />
              <p>{student.className}</p>
            </div>
            <div className="detail-grid">
              <Detail label="Class" value={student.className} />
              <Detail label="Age" value={student.age || '-'} />
              <Detail label="Gender" value={student.gender || '-'} />
              <Detail label="Guardian" value={student.guardianName || '-'} />
              <Detail label="Contact" value={student.guardianContact || '-'} />
              <Detail label="Attendance" value={`${value}% (${student.attendanceStats?.attended ?? student.attended ?? 0}/${student.attendanceStats?.conducted ?? student.conducted ?? 0})`} />
              <Detail label="Latest Note" value={student.note || '-'} wide />
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

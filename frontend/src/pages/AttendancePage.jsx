import { useEffect, useMemo, useState } from 'react';
import { Camera, Check, ChevronLeft, ChevronRight, Image, RotateCcw, Save, Upload } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import { Metric } from '../components/Metric.jsx';
import { ResponsiveTable } from '../components/ResponsiveTable.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { config } from '../config.js';
import { apiRequest } from '../utils/api.js';
import { percent } from '../utils/attendance.js';
import { mongoId } from '../utils/api.js';

function classNumber(className) {
  const match = String(className).match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortClasses(classes) {
  return [...classes].sort((a, b) => classNumber(a) - classNumber(b) || a.localeCompare(b));
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });

export function AttendancePage({ students, setStudents, classes: classGroups = [], setPhotos }) {
  const classNames = useMemo(
    () =>
      sortClasses(
        new Set(
          classGroups.length
            ? classGroups.map((item) => item.name)
            : students.filter((student) => student.activeStatus !== false && student.active !== false).map((student) => student.className)
        )
      ),
    [classGroups, students]
  );
  const [selectedClass, setSelectedClass] = useState(classNames[0] || '');
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState([]);
  const [submittedSession, setSubmittedSession] = useState(null);
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [linkedPhoto, setLinkedPhoto] = useState(null);
  const [proofState, setProofState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    if (!selectedClass && classNames.length) {
      setSelectedClass(classNames[0]);
    }
  }, [classNames, selectedClass]);

  useEffect(() => {
    if (!proofFile) {
      setProofPreview('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(proofFile);
    setProofPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [proofFile]);

  const roster = students.filter((student) => student.activeStatus !== false && student.active !== false && student.className === selectedClass);
  const current = roster[index];
  const present = records.filter((record) => record.status === 'present').length;
  const absent = records.filter((record) => record.status === 'absent').length;
  const completed = Math.round((records.length / Math.max(roster.length, 1)) * 100);
  const reviewRows = records.map((record) => {
    const student = students.find((item) => mongoId(item) === record.studentId);
    return { ...record, student };
  });

  const resetSession = (className = selectedClass) => {
    setSelectedClass(className);
    setIndex(0);
    setRecords([]);
    setSubmittedSession(null);
    setProofFile(null);
    setProofPreview('');
    setLinkedPhoto(null);
    setSubmitState({ status: 'idle', message: '' });
    setProofState({ status: 'idle', message: '' });
  };

  const mark = (status) => {
    if (!current) return;
    setRecords((items) => [
      ...items,
      {
        studentId: mongoId(current),
        status,
        recordedAt: new Date().toISOString()
      }
    ]);
    setIndex((value) => value + 1);
  };

  const undo = () => {
    if (!records.length) return;
    setRecords((items) => items.slice(0, -1));
    setIndex((value) => Math.max(value - 1, 0));
    setSubmittedSession(null);
  };

  const updateRecord = (studentId, status) => {
    setRecords((items) => items.map((record) => (record.studentId === studentId ? { ...record, status } : record)));
    setSubmittedSession(null);
  };

  const submitAttendance = async () => {
    if (records.length !== roster.length) {
      setSubmitState({ status: 'error', message: 'Please mark every student before submitting.' });
      return;
    }

    const payload = {
      centerId: roster[0]?.centerId || config.defaultCenter,
      className: selectedClass,
      teacherId: 'demo-teacher',
      date: new Date().toISOString(),
      totalStudents: roster.length,
      presentCount: present,
      absentCount: absent,
      records: records.map((record) => ({
        studentId: record.studentId,
        status: record.status,
        recordedAt: record.recordedAt
      }))
    };

    setSubmitState({ status: 'saving', message: 'Saving attendance session...' });

    try {
      const session = await apiRequest(config.apiRoutes.attendanceSession, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSubmittedSession(session);
      setStudents((items) =>
        items.map((student) => {
          const record = records.find((item) => item.studentId === mongoId(student));
          if (!record) return student;
          return {
            ...student,
            attendanceStats: {
              ...(student.attendanceStats || {}),
              conducted: (student.attendanceStats?.conducted ?? student.conducted ?? 0) + 1,
              attended: (student.attendanceStats?.attended ?? student.attended ?? 0) + (record.status === 'present' ? 1 : 0)
            }
          };
        })
      );
      setSubmitState({ status: 'success', message: 'Attendance saved successfully.' });
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: `${error.message} Check MongoDB/API configuration if this is a local run.`
      });
    }
  };

  const linkProofPhoto = async () => {
    if (!submittedSession || !proofFile) {
      setProofState({ status: 'error', message: 'Save attendance and choose a class photo first.' });
      return;
    }

    setProofState({ status: 'saving', message: 'Linking photo proof...' });
    try {
      const imageUrl = await readFileAsDataUrl(proofFile);
      const payload = {
        imageUrl,
        caption: `${selectedClass} class proof`,
        center: roster[0]?.center || roster[0]?.centerId || config.defaultCenter,
        centerId: submittedSession.centerId || roster[0]?.centerId || config.defaultCenter,
        className: selectedClass,
        activity: 'Attendance class proof',
        activityDate: submittedSession.date || new Date().toISOString(),
        relatedSessionId: submittedSession._id || submittedSession.id,
        uploadedBy: submittedSession.teacherId || 'teacher'
      };

      const response = await apiRequest(`${config.apiRoutes.photos}/upload`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const photo = {
        ...payload,
        ...(response.photo || {}),
        id: response.photo?._id || response.photo?.id || crypto.randomUUID(),
        date: new Date(payload.activityDate).toISOString().slice(0, 10)
      };
      setLinkedPhoto(photo);
      setPhotos?.((items) => [photo, ...items]);
      setProofState({ status: 'success', message: 'Photo proof linked to this class session.' });
    } catch (error) {
      setProofState({ status: 'error', message: error.message });
    }
  };

  return (
    <section className="section tinted">
      <div className="container page-hero with-action">
        <div>
          <span className="eyebrow">Attendance</span>
          <h2>Choose a class, mark each profile, review mistakes, then submit.</h2>
          <p>Left marks absent. Right marks present. Nothing is stored until you submit the reviewed session.</p>
        </div>
        <label className="class-picker">
          <span>Class</span>
          <select value={selectedClass} onChange={(event) => resetSession(event.target.value)}>
            {classNames.map((className) => (
              <option value={className} key={className}>{className}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="container attendance-workspace">
        <aside className="summary-panel">
          <h3>{selectedClass || 'No class selected'}</h3>
          <Metric value={roster.length} label="students" />
          <Metric value={present} label="present" />
          <Metric value={absent} label="absent" />
          <Metric value={`${completed}%`} label="completed" />
          <button className="secondary-button" onClick={undo} disabled={!records.length || Boolean(submittedSession)}>
            <RotateCcw size={18} /> Undo
          </button>
        </aside>

        <div className="attendance-main">
          {roster.length ? (
            <AttendanceDeck student={current} mark={mark} disabled={Boolean(submittedSession)} />
          ) : (
            <EmptyState title="No students in this class" text="Choose another class or add students first." />
          )}
        </div>
      </div>

      <div className="container attendance-review">
        <div className="table-card">
          <div className="review-heading">
            <div>
              <span className="eyebrow">Review</span>
              <h3>Marked attendance list</h3>
            </div>
            <div className="button-row">
              <button className="secondary-button" onClick={() => resetSession()} disabled={!records.length}>
                <RotateCcw size={18} /> Reset
              </button>
              <button
                className="primary-button"
                onClick={submitAttendance}
                disabled={!records.length || records.length !== roster.length || submitState.status === 'saving' || Boolean(submittedSession)}
              >
                <Save size={18} /> Submit to MongoDB
              </button>
            </div>
          </div>

          {reviewRows.length ? (
            <AttendanceReviewTable rows={reviewRows} updateRecord={updateRecord} locked={Boolean(submittedSession)} />
          ) : (
            <EmptyState title="No marks yet" text="Start with the first profile above." />
          )}

          {submitState.message && (
            <p className={`submit-message ${submitState.status}`}>
              {submitState.status === 'success' && <Check size={18} />}
              {submitState.message}
            </p>
          )}
        </div>
      </div>

      {submittedSession && (
        <div className="container attendance-proof-grid">
          <div className="table-card proof-card">
            <div className="review-heading">
              <div>
                <span className="eyebrow">Class proof</span>
                <h3>Link a photo after attendance</h3>
              </div>
              {linkedPhoto && (
                <a className="secondary-button" href={linkedPhoto.imageUrl} target="_blank" rel="noreferrer">
                  <Image size={18} /> Preview linked photo
                </a>
              )}
            </div>
            <div className="proof-upload-row">
              <label className="click-image-card">
                <Camera size={22} />
                <strong>Click image</strong>
                <span>Take or choose one photo as proof that the class was held.</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                />
              </label>
              {proofPreview || linkedPhoto ? (
                <figure className="proof-preview">
                  <img src={linkedPhoto?.imageUrl || proofPreview} alt="Class proof preview" />
                  <figcaption>{linkedPhoto ? 'Linked photo proof' : 'Selected photo preview'}</figcaption>
                </figure>
              ) : (
                <EmptyState title="No proof image selected" text="Add one photo after taking attendance." />
              )}
            </div>
            <button className="primary-button" onClick={linkProofPhoto} disabled={!proofFile || proofState.status === 'saving'}>
              <Upload size={18} /> Link photo proof
            </button>
            {proofState.message && <p className={`submit-message ${proofState.status}`}>{proofState.message}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

function AttendanceDeck({ student, mark, disabled }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(null);
  const [exitStatus, setExitStatus] = useState(null);

  if (!student) {
    return <EmptyState title="Class review ready" text="Check the list below, edit any mistake, then submit." />;
  }

  const value = percent(student);
  const commitStatus = (status) => {
    if (disabled) return;
    setExitStatus(status);
    setDragX(status === 'present' ? 420 : -420);
    setDragging(false);
    setStartX(null);
    window.setTimeout(() => {
      mark(status);
      setExitStatus(null);
      setDragX(0);
    }, 220);
  };

  const commitDrag = () => {
    if (disabled) return;
    if (dragX > 90) {
      commitStatus('present');
      return;
    }
    if (dragX < -90) {
      commitStatus('absent');
      return;
    }
    setDragX(0);
    setDragging(false);
    setStartX(null);
  };

  const moveTo = (clientX) => {
    if (startX === null || disabled) return;
    const nextX = Math.max(Math.min(clientX - startX, 160), -160);
    setDragX(nextX);
  };

  return (
    <div className="swipe-stage">
      <div className={`swipe-zone left ${dragX < -25 ? 'active' : ''}`}>
        <ChevronLeft size={34} />
        <span>Absent</span>
      </div>
      <div className={`swipe-zone right ${dragX > 25 ? 'active' : ''}`}>
        <span>Present</span>
        <ChevronRight size={34} />
      </div>
      <article
        className={`swipe-card ${dragging ? 'dragging' : ''} ${exitStatus ? `exiting ${exitStatus}` : ''}`}
        style={{
          '--drag-progress': Math.min(Math.abs(dragX) / 120, 1),
          transform: `translate3d(${dragX}px, 0, 0) rotate(${dragX / 18}deg)`
        }}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') commitStatus('present');
          if (event.key === 'ArrowLeft') commitStatus('absent');
        }}
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          setStartX(event.clientX);
        }}
        onPointerMove={(event) => dragging && moveTo(event.clientX)}
        onPointerUp={commitDrag}
        onPointerCancel={() => {
          setDragX(0);
          setDragging(false);
          setStartX(null);
        }}
      >
        <div className={`swipe-stamp absent ${dragX < -45 ? 'visible' : ''}`}>Absent</div>
        <div className={`swipe-stamp present ${dragX > 45 ? 'visible' : ''}`}>Present</div>
        <img src={student.photoUrl} alt={student.name} />
        <div className="swipe-card-body">
          <StatusBadge value={value} />
          <h3>{student.name}</h3>
          <p>{student.className} · Age {student.age}</p>
          <dl>
            <div><dt>Center</dt><dd>{student.center}</dd></div>
            <div><dt>Guardian</dt><dd>{student.guardianName}</dd></div>
            <div><dt>Last note</dt><dd>{student.note}</dd></div>
          </dl>
          <div className="button-row split">
            <button className="danger-button" onClick={() => commitStatus('absent')} disabled={disabled}>
              <ChevronLeft size={18} /> Absent
            </button>
            <button className="primary-button" onClick={() => commitStatus('present')} disabled={disabled}>
              Present <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function AttendanceReviewTable({ rows, updateRecord, locked }) {
  return (
    <ResponsiveTable
      headers={['Student', 'Class', 'Center', 'Status', 'Edit']}
      rows={rows.map(({ student, status }) => [
        student?.name || 'Unknown student',
        student?.className || '-',
        student?.center || '-',
        status === 'present' ? 'Present' : 'Absent',
        <div className="segmented-status" key={mongoId(student)}>
          <button
            className={status === 'present' ? 'active present' : ''}
            onClick={() => updateRecord(mongoId(student), 'present')}
            disabled={locked}
          >
            Present
          </button>
          <button
            className={status === 'absent' ? 'active absent' : ''}
            onClick={() => updateRecord(mongoId(student), 'absent')}
            disabled={locked}
          >
            Absent
          </button>
        </div>
      ])}
    />
  );
}

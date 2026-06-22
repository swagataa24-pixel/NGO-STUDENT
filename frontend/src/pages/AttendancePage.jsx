import { useEffect, useMemo, useState } from 'react';
import { Camera, Check, ChevronLeft, ChevronRight, RotateCcw, Save } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import { Metric } from '../components/Metric.jsx';
import { ResponsiveTable } from '../components/ResponsiveTable.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import './AttendancePage.css';
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
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState([]);
  const [submittedSession, setSubmittedSession] = useState(null);
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [linkedPhoto, setLinkedPhoto] = useState(null);

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
    if (!proofFile) {
      setSubmitState({ status: 'error', message: 'Please attach one class photo proof before submitting.' });
      return;
    }

    const payload = {
      centerId: roster[0]?.centerId || config.defaultCenter,
      className: selectedClass,
      teacherId: 'demo-teacher',
      date: new Date(`${sessionDate}T12:00:00`).toISOString(),
      totalStudents: roster.length,
      presentCount: present,
      absentCount: absent,
      records: records.map((record) => ({
        studentId: record.studentId,
        status: record.status,
        recordedAt: record.recordedAt
      }))
    };

    setSubmitState({ status: 'saving', message: 'Saving attendance and linking photo proof...' });

    try {
      const session = await apiRequest(config.apiRoutes.attendanceSession, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const imageUrl = await readFileAsDataUrl(proofFile);
      const photoPayload = {
        imageUrl,
        caption: `${selectedClass} class proof`,
        center: roster[0]?.center || roster[0]?.centerId || config.defaultCenter,
        centerId: session.centerId || roster[0]?.centerId || config.defaultCenter,
        className: selectedClass,
        activity: 'Attendance class proof',
        activityDate: payload.date,
        relatedSessionId: session._id || session.id,
        uploadedBy: session.teacherId || 'teacher'
      };
      const response = await apiRequest(`${config.apiRoutes.photos}/upload`, {
        method: 'POST',
        body: JSON.stringify(photoPayload)
      });
      const photo = {
        ...photoPayload,
        ...(response.photo || {}),
        id: response.photo?._id || response.photo?.id || crypto.randomUUID(),
        date: sessionDate
      };
      setSubmittedSession(session);
      setLinkedPhoto(photo);
      setPhotos?.((items) => [photo, ...items]);
      setStudents((items) =>
        items.map((student) => {
          const record = records.find((item) => item.studentId === mongoId(student));
          if (!record) return student;
          const conducted = (student.attendanceStats?.conducted ?? student.conducted ?? 0) + 1;
          const attended = (student.attendanceStats?.attended ?? student.attended ?? 0) + (record.status === 'present' ? 1 : 0);
          return {
            ...student,
            conducted,
            attended,
            attendanceStats: {
              ...(student.attendanceStats || {}),
              conducted,
              attended
            }
          };
        })
      );
      setSubmitState({ status: 'success', message: 'Attendance and photo proof saved successfully.' });
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: `${error.message} Check MongoDB/API configuration if this is a local run.`
      });
    }
  };

  return (
    <section className="section tinted">
      <div className="container page-hero with-action">
        <div>
          <span className="eyebrow">Operational Logs</span>
          <h2>Capture classroom sessions, record student presence, and upload proofs.</h2>
          <p>Attendance records are finalized and saved once all students are registered and classroom photo proof is attached.</p>
        </div>
        <div className="attendance-start-controls">
          <label className="class-picker">
            <span>Date</span>
            <input type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} disabled={Boolean(records.length)} />
          </label>
          <label className="class-picker">
            <span>Class</span>
            <select value={selectedClass} onChange={(event) => resetSession(event.target.value)} disabled={Boolean(records.length)}>
              {classNames.map((className) => (
                <option value={className} key={className}>{className}</option>
              ))}
            </select>
          </label>
        </div>
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
                disabled={!records.length || records.length !== roster.length || !proofFile || submitState.status === 'saving' || Boolean(submittedSession)}
              >
                <Save size={18} /> Submit attendance
              </button>
            </div>
          </div>

          {reviewRows.length ? (
            <AttendanceReviewTable rows={reviewRows} updateRecord={updateRecord} locked={Boolean(submittedSession)} />
          ) : (
            <EmptyState title="No marks yet" text="Start with the first profile above." />
          )}

          {records.length === roster.length && roster.length > 0 && (
            <div className="inline-proof-panel">
              <div className="review-heading">
                <div>
                  <span className="eyebrow">Photo proof</span>
                  <h3>Add class image before final submit</h3>
                </div>
                {linkedPhoto && (
                  <a className="secondary-button" href={linkedPhoto.imageUrl} target="_blank" rel="noreferrer">
                    Preview linked photo
                  </a>
                )}
              </div>
              <div className="proof-upload-row">
                <label className="click-image-card">
                  <Camera size={22} />
                  <strong>Click image</strong>
                  <span>Take or choose one photo as proof that the class was held on {sessionDate}.</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={Boolean(submittedSession)}
                    onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                  />
                </label>
                {proofPreview || linkedPhoto ? (
                  <figure className="proof-preview">
                    <img src={linkedPhoto?.imageUrl || proofPreview} alt="Class proof preview" />
                    <figcaption>{linkedPhoto ? 'Linked photo proof' : `Selected proof for ${sessionDate}`}</figcaption>
                  </figure>
                ) : (
                  <EmptyState title="No proof image selected" text="Attach one photo before final submit." />
                )}
              </div>
            </div>
          )}

          {submitState.message && (
            <p className={`submit-message ${submitState.status}`}>
              {submitState.status === 'success' && <Check size={18} />}
              {submitState.message}
            </p>
          )}
        </div>
      </div>
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

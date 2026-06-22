import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw, Save } from 'lucide-react';
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

export function AttendancePage({ students, setStudents, classes: classGroups = [] }) {
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

  useEffect(() => {
    if (!selectedClass && classNames.length) {
      setSelectedClass(classNames[0]);
    }
  }, [classNames, selectedClass]);

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

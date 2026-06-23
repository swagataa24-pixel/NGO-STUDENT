import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, Image as ImageIcon } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import { config } from '../config.js';
import { apiRequest, mongoId } from '../utils/api.js';
import './VolunteerDetailPage.css';

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function VolunteerDetailPage({ attendanceSessions = [], photos = [], dataStatus, refreshData }) {
  const { volunteerId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const users = await apiRequest(config.apiRoutes.users);
        const teacherList = users.filter((user) => user.role === 'Teacher');
        const selectedTeacher = teacherList.find((t) => mongoId(t) === volunteerId);
        setTeacher(selectedTeacher || null);
      } catch (error) {
        console.error('Error fetching teacher:', error);
        setTeacher(null);
      }
    };
    fetchTeacher();
  }, [volunteerId]);

  const teacherAttendance = useMemo(() => {
    if (!teacher) return [];
    const teacherIdentifier = teacher.name || teacher.email;
    return attendanceSessions.filter((session) => session.teacherId === teacherIdentifier);
  }, [attendanceSessions, teacher]);

  const teacherPhotos = useMemo(() => {
    if (!teacher) return [];
    const teacherIdentifier = teacher.name || teacher.email;
    return photos.filter((photo) => photo.uploadedBy === teacherIdentifier);
  }, [photos, teacher]);

  if (!teacher) {
    return (
      <section className="section">
        <div className="container page-hero">
          <Link to={config.routes.volunteers} className="eyebrow link-button">
            <ChevronLeft size={16} /> Back to teachers
          </Link>
          <h2>Teacher not found</h2>
          <p>The teacher you're looking for doesn't exist or has been removed.</p>
        </div>
        <div className="container">
          <EmptyState
            title="Teacher not found"
            text="Please return to the teachers list."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container page-hero with-action">
        <div>
          <Link to={config.routes.volunteers} className="eyebrow link-button">
            <ChevronLeft size={16} /> Back to teachers
          </Link>
          <h2>{teacher.name}</h2>
          <p>{teacher.email}</p>
        </div>
      </div>

      <div className="container">
        {/* Attendance Sessions */}
        <section className="volunteer-detail-card">
          <div className="detail-card-heading">
            <Calendar size={18} />
            <h4>Attendance Sessions</h4>
            <span>{teacherAttendance.length}</span>
          </div>
          {teacherAttendance.length ? (
            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Students</th>
                    <th>Present</th>
                    <th>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherAttendance.sort((a, b) => new Date(b.date) - new Date(a.date)).map((session) => (
                    <tr key={mongoId(session) || session._id}>
                      <td>{formatDate(session.date)}</td>
                      <td>{session.className}</td>
                      <td>{session.totalStudents}</td>
                      <td className="cell-center">{session.presentCount}</td>
                      <td className="cell-center">{session.absentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No attendance sessions" text="This teacher hasn't recorded any attendance yet." />
          )}
        </section>

        {/* Uploaded Photos */}
        <section className="volunteer-detail-card">
          <div className="detail-card-heading">
            <ImageIcon size={18} />
            <h4>Uploaded Photos</h4>
            <span>{teacherPhotos.length}</span>
          </div>
          {teacherPhotos.length ? (
            <div className="photos-grid">
              {teacherPhotos.sort((a, b) => new Date(b.activityDate || b.date) - new Date(a.activityDate || a.date)).map((photo) => (
                <div key={mongoId(photo) || photo.id || photo.imageUrl} className="photo-card">
                  <img src={photo.imageUrl} alt={photo.caption || photo.activity || 'Activity photo'} />
                  <div className="photo-details">
                    <p className="photo-caption">{photo.caption || photo.activity || 'Activity proof'}</p>
                    <p className="photo-date">{formatDate(photo.activityDate || photo.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No photos uploaded" text="This teacher hasn't uploaded any photos yet." />
          )}
        </section>
      </div>
    </section>
  );
}

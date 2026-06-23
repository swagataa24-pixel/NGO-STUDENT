import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Users } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import './VolunteersPage.css';
import { config } from '../config.js';
import { apiRequest, mongoId } from '../utils/api.js';

export function VolunteersPage({
  activeUser,
  students = [],
  classes = [],
  attendanceSessions = [],
  dataStatus,
  refreshData
}) {
  const [query, setQuery] = useState('');
  const [teachers, setTeachers] = useState([]);

  // Fetch teachers (users with role="Teacher")
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const users = await apiRequest(config.apiRoutes.users);
        const teacherList = users.filter((user) => user.role === 'Teacher');
        setTeachers(teacherList);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setTeachers([]);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(
    () =>
      teachers.filter((teacher) =>
        [teacher.name, teacher.email]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [teachers, query]
  );

  return (
    <section className="section">
      <div className="container page-hero">
        <div>
          <span className="eyebrow">Team Management</span>
          <h2>Teachers Activity Overview</h2>
          <p>View and monitor the activity of all teaching staff, including their attendance sessions and uploaded photos.</p>
        </div>
      </div>

      <div className="container">
        <div className="search-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search teachers by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredTeachers.length ? (
          <div className="teachers-grid">
            {filteredTeachers.map((teacher) => {
              const teacherIdentifier = teacher.name || teacher.email;
              const teacherAttendance = attendanceSessions.filter(
                (session) => session.teacherId === teacherIdentifier
              );
              return (
                <Link
                  key={mongoId(teacher)}
                  to={`${config.routes.volunteers}/${mongoId(teacher)}`}
                  className="teacher-card"
                >
                  <div className="teacher-header">
                    <div className="teacher-info">
                      <h3>{teacher.name}</h3>
                      <p className="teacher-email">{teacher.email}</p>
                    </div>
                    <ChevronRight size={20} />
                  </div>
                  <div className="teacher-stats">
                    <div className="stat">
                      <span className="stat-value">{teacherAttendance.length}</span>
                      <span className="stat-label">Sessions</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={query ? 'No teachers found' : 'No teachers available'}
            text={query ? 'Try adjusting your search criteria.' : 'No teachers have been added to the system yet.'}
          />
        )}
      </div>
    </section>
  );
}

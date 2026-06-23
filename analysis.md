# Full System Analysis & Bug Report
## Date: 2026-06-23

---

## 1. Data Models & Relationships

### Models
1. **User** (`/backend/server/models/User.js`):
   - Fields: name (encrypted), email (encrypted), emailIndex (HMAC blind index), role (Admin/Teacher/Viewer), password (bcrypt hash), googleId, avatar, isBlocked, timestamps

2. **ClassGroup** (`/backend/server/models/ClassGroup.js`):
   - Fields: name, centerId, teacher, description, activeStatus, timestamps

3. **Student** (`/backend/server/models/Student.js`):
   - Fields: name, photoUrl, age, gender, className, classId (ref to ClassGroup), guardianName, guardianContact, attendanceStats, progressNotes, activeStatus, timestamps

4. **ActivityPhoto** (`/backend/server/models/ActivityPhoto.js`):
   - Fields: imageUrl, cloudinaryPublicId, caption, center, classId (ref to ClassGroup), className, activity, uploadedBy, centerId, activityDate, relatedSessionId (ref to AttendanceSession), timestamps

5. **AttendanceSession** (`/backend/server/models/AttendanceSession.js`):
   - Fields: centerId, classId (ref to ClassGroup), className, teacherId, date, totalStudents, presentCount, absentCount, records: [{studentId (ref to Student), status, note, recordedAt}], timestamps

6. **Report** (`/backend/server/models/Report.js`):
   - Fields: month, year, centerId, summary, attendanceSummary, volunteerSummary, progressSummary, photoRefs: [ObjectId (ref to ActivityPhoto)], timestamps

7. **Volunteer** (`/backend/server/models/Volunteer.js`)

---

## 2. Authentication & Authorization Issues Found (CRITICAL)

### Issue 2.1: Missing Authentication Middleware on Multiple Routes
The following backend routes do NOT require authentication, allowing ANYONE to access/modify data:
- `/api/classes` - all methods (GET, POST, PUT, PATCH, DELETE)
- `/api/students` - all methods (GET, POST, PUT, PATCH, DELETE)
- `/api/progress` - all methods (GET, POST)
- `/api/volunteers` - GET method

### Issue 2.2: No Data Ownership/Privacy Controls
- Teachers can access and modify ALL data in the system, not just their own
- No filtering of data by current user
- Admin and Teacher roles have full access to everything
- No tracking of which user created/modified which data

### Issue 2.3: ClassGroup Model Doesn't Track Owner
- The `ClassGroup.teacher` field exists, but it's just a string (not a reference to a User)
- No way to link a class to a specific teacher's user account

### Issue 2.4: Other Models Also Don't Track Creator/Owner
- ActivityPhoto: has `uploadedBy` (unknown format)
- AttendanceSession: has `teacherId` (unknown if it's a User reference)
- No consistent way to track data ownership

---

## 3. Other Issues

### Issue 3.1: Frontend API Call for Attendance Sessions
In `App.jsx` line 178: calls `config.apiRoutes.attendanceSession`, but backend API route is `config.apiRoutes.attendance`

### Issue 3.2: Class Deletion Frontend Sync (FIXED)
Previously: `StudentsPage.deleteClass` only updated local state. Now it uses `refreshData`.

---

## 4. Proposed Fixes

### Priority 1: Add Authentication Middleware to All Routes
Apply `requireAuth` to:
- classRouter
- studentRouter
- progressRouter
- volunteerRouter (GET)

### Priority 2: Implement Data Privacy & Ownership
- Track owner on all data models
- Filter all data queries by current user for non‑Admin users
- Ensure teachers can only access/modify their own data

### Priority 3: Fix Frontend Attendance Route
Change `config.apiRoutes.attendanceSession` to match backend route

---

## 5. Task Status
- [x] Analyze all models and relationships
- [x] Fix frontend state updates on class deletion
- [x] Add authentication to all unprotected routes
- [x] Implement data ownership/privacy controls
- [x] Fix frontend API route for attendance sessions

## Key Improvements Made:
1. **Authentication Coverage**: Added `requireAuth` middleware to:
   - `/api/classes` (all methods)
   - `/api/students` (all methods)
   - `/api/progress` (all methods)
   - `/api/volunteers` (all methods)

2. **Data Privacy & Ownership**:
   - **User Data**: Emails are encrypted at rest (AES-256-GCM) with blind index for lookups; user roles enforced by `ADMIN_EMAILS` env var
   - **ClassGroup**: Teachers can only view/edit/delete their own classes
   - **Student**: Teachers can only view/edit/delete students in their own classes
   - **ActivityPhoto**: 
     - Fixed to NOT show photos with `uploadedBy: null/empty` to teachers
     - Now only shows teachers photos they uploaded OR photos linked to their classes
   - **AttendanceSession**: 
     - Now filters sessions to teacher's classes (not just teacherId)
     - Teachers can only create sessions for their own classes
     - Teachers can only record attendance for their own sessions
     - createSession now automatically sets teacherId
   - **Progress Notes**: Teachers can only view/add notes to their own students; notes now track author
   - **Reports**:
     - Now properly filters students to only teacher's own classes
     - Filters photos using same class-based logic
     - Only admins see volunteer data in reports
   - **Volunteers**: Only admins can view, update, and delete volunteers

3. **User Blocking & Deletion**:
   - **User Model**: Added `isBlocked` field (default false)
   - **Backend Routes**:
     - `PATCH /api/users/:id/block`: Toggle user block status (admin only)
     - `DELETE /api/users/:id`: Permanently delete user (admin only)
   - **Auth Checks**:
     - `signinWithPassword`: Checks `isBlocked` before allowing login
     - `resolveAuthenticatedUser`: Checks `isBlocked` for Google sign-in
     - `requireAuth`: Now queries fresh user data from DB to check `isBlocked` on every authenticated request
   - **Frontend UI**: AdminPage already has full UI for blocking, deleting, and editing users

4. **Frontend Fixes**:
   - Fixed attendance API route config (added `apiRoutes.attendance` to `config.js`)
   - Updated class deletion logic to fully refresh all data via `refreshData()`

5. **Backend Improvements**:
   - All service functions now accept and use `req.user` for ownership checks
   - Proper error handling for unauthorized access attempts
   - Improved consistency across all data models
   - Added `--border-subtle` CSS variable to global styles

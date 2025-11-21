# Missing Functionality in Frontend

**Date of Birth:** 2025-11-20  
**Backend Version:** ASP.NET Core 9.0 Attendance Monitoring System

This document outlines the features available in the backend API that are not yet implemented in the frontend application.

---

## Table of Contents

1. [Critical Missing Features](#1-critical-missing-features)
2. [High Priority Features](#2-high-priority-features)
3. [Medium Priority Features](#3-medium-priority-features)
4. [Low Priority Features](#4-low-priority-features)
5. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Critical Missing Features

### 1.1 Attendance Recording & Management ⚠️ **CRITICAL**

The backend has attendance functionality, but there is **no attendance-related API service or views** in the frontend.

**Missing Components:**
- ❌ No `src/api/attendance.js` file
- ❌ No attendance recording views
- ❌ No attendance management store

**Missing Features:**
- Record attendance for students in active sessions
- View attendance records by session or student
- Mark students as present/absent/late
- Bulk attendance recording
- QR code scanning for attendance (backend supports QR code generation)
- Attendance history for individual students
- Attendance summaries and statistics
- Late arrival tracking and cutoff management

**Backend Endpoints Available:**
```
POST   /api/attendance                          (Admin, Instructor only)
GET    /api/attendance/{id}                     (Get specific record)
GET    /api/attendance                          (Get all with filtering/pagination)
GET    /api/attendance/student/{studentId}      (Get student attendance history)
GET    /api/attendance/session/{sessionId}      (Get session attendance - Admin, Instructor only)
GET    /api/attendance/summary                  (Get attendance statistics)
PUT    /api/attendance/{id}                     (Admin, Instructor only)
DELETE /api/attendance/{id}                     (Admin only)
```

**Impact:** This is the **core functionality** of the system. Without it, the application cannot fulfill its primary purpose.

---

## 2. High Priority Features

### 2.1 Student Enrollment Management

The backend supports student enrollment in sections, but the frontend lacks this functionality entirely.

**Missing Components:**
- ❌ No enrollment endpoints in any API file
- ❌ No enrollment management UI
- ❌ No enrollment store

**Missing Features:**
- Enroll students in sections
- View enrolled students per section
- Unenroll/remove students from sections
- View enrollment status (active/inactive/dropped)
- Bulk enrollment operations
- Student's enrolled sections view
- Enrollment history tracking

**Backend Endpoints Available:**
```
POST   /api/enrollments
GET    /api/enrollments/section/{sectionId}
GET    /api/enrollments/student/{studentId}
PUT    /api/enrollments/{id}
DELETE /api/enrollments/{id}
```

**Impact:** Cannot assign students to classes, making attendance tracking impossible.

---

### 2.2 Schedule Management

The backend has schedule management for assigning classrooms and time slots to sections.

**Missing Components:**
- ❌ No `src/api/schedules.js` file
- ❌ No schedule management views
- ❌ No schedule store

**Missing Features:**
- Create schedules for sections
- Assign time slots to sections
- Assign classrooms to sections
- View section schedules (timetable)
- Edit/update schedules
- Delete schedules
- Schedule conflict detection
- Weekly/daily schedule views
- Instructor schedule overview

**Backend Endpoints Available:**
```
POST   /api/schedules
GET    /api/schedules
GET    /api/schedules/{id}
GET    /api/schedules/section/{sectionId}
GET    /api/schedules/instructor/{instructorId}
PUT    /api/schedules/{id}
DELETE /api/schedules/{id}
```

**Impact:** Cannot properly organize class sessions or manage classroom assignments.

---

## 3. Medium Priority Features

### 3.1 Subject Management

While course management exists, subjects appear to be separate entities in the backend.

**Missing Components:**
- ❌ No `src/api/subjects.js` file
- ❌ No subject management views
- ❌ No subject store

**Missing Features:**
- Create/edit/delete subjects
- Assign subjects to courses
- View all subjects
- Subject details view
- Subject-course relationships
- Subject code and name management

**Backend Endpoints Available:**
```
POST   /api/subjects
GET    /api/subjects
GET    /api/subjects/{id}
GET    /api/subjects/course/{courseId}
PUT    /api/subjects/{id}
DELETE /api/subjects/{id}
```

**Impact:** Limited ability to organize course content and structure.

---

### 3.2 Classroom Management (Incomplete)

Basic classrooms API exists but no UI implementation.

**Existing:**
- ✅ `src/api/classrooms.js` (read-only operations)

**Missing Features:**
- Admin view to manage classrooms
- Create/edit/delete classrooms
- View classroom details
- Classroom availability/scheduling
- Classroom capacity management
- Room assignment to schedules
- Classroom utilization reports

**Backend Endpoints Available:**
```
POST   /api/classrooms
GET    /api/classrooms
GET    /api/classrooms/{id}
PUT    /api/classrooms/{id}
DELETE /api/classrooms/{id}
```

**Current Frontend:** Only has read operations (`getClassrooms`, `getClassroomById`)

**Impact:** Cannot manage classroom resources effectively.

---

### 3.3 Student Management

The backend supports comprehensive student operations, but the frontend is minimal.

**Existing:**
- ✅ Basic `src/stores/studentStore.js` (only 619 bytes - very minimal)

**Missing Features:**
- Student CRUD operations (Create, Read, Update, Delete)
- Student profile view
- Student list view with search and filters
- Soft delete/restore students
- Advanced search and filtering
- View student's enrolled sections
- View student's attendance history
- Student performance metrics
- Student contact information management
- Student ID/number management

**Backend Endpoints Available:**
```
POST   /api/students
GET    /api/students
GET    /api/students/{id}
PUT    /api/students/{id}
DELETE /api/students/{id}
POST   /api/students/{id}/restore
```

**Impact:** Limited student data management capabilities.

---

### 3.4 Instructor Management (Incomplete)

Limited instructor functionality exists.

**Existing:**
- ✅ `src/api/instructors.js` (only profile and schedules)

**Missing Features:**
- Admin view to manage instructors
- Create/edit/delete instructors
- Assign instructors to sections
- View instructor details
- Soft delete/restore instructors
- Instructor list view
- Instructor workload overview
- Instructor contact information
- Department/specialization management

**Backend Endpoints Available:**
```
POST   /api/instructors
GET    /api/instructors
GET    /api/instructors/{id}
GET    /api/instructors/me
GET    /api/instructors/me/schedules
PUT    /api/instructors/{id}
DELETE /api/instructors/{id}
POST   /api/instructors/{id}/restore
```

**Current Frontend:** Only has `getMyProfile` and `getMySchedules`

**Impact:** Cannot fully manage instructor resources.

---

## 4. Low Priority Features

### 4.1 Enhanced Reports & Analytics

Current reports use mock/hardcoded data instead of real backend data.

**Existing:**
- ✅ `src/views/ReportsView.vue` (uses mock data)

**Missing Backend Integration:**
- Real attendance data from backend
- Attendance reports by session, section, student, or date range
- Attendance summaries (total present/absent/late)
- Performance metrics based on actual data
- Export reports (PDF, Excel, CSV)
- Detailed attendance history
- Late arrival tracking and statistics
- Trend analysis over time
- Comparative analytics (section vs section, student vs student)
- Customizable report parameters

**Backend Endpoints Available:**
```
GET    /api/reports/attendance/summary
GET    /api/reports/attendance/student/{studentId}
GET    /api/reports/attendance/section/{sectionId}
GET    /api/reports/attendance/date-range
```

**Impact:** Cannot make data-driven decisions based on real attendance data.

---

### 4.2 QR Code Integration

Backend supports QR code generation for attendance tracking.

**Missing Features:**
- Generate QR codes for sessions
- Display QR codes for students to scan
- QR code scanning interface (mobile-friendly)
- QR code-based attendance marking
- Dynamic QR code refresh for security
- QR code attendance verification
- Mobile app integration for scanning

**Backend Support:**
- QRCoder library integrated
- QR code generation for sessions
- Secure QR code validation

**Impact:** Missing modern, contactless attendance marking method.

---

### 4.3 Token Management (Admin)

Backend has JWT token blacklist and automatic cleanup.

**Missing Features:**
- View active sessions/tokens
- Revoke tokens manually
- View token blacklist
- Token expiration management
- Force logout users
- Session management dashboard
- Security audit logs

**Backend Features:**
- JWT authentication with refresh tokens
- Token blacklist system
- Background service for expired token cleanup
- Token expiration configuration

**Impact:** Limited admin control over user sessions and security.

---

### 4.4 User Profile Management

**Missing Features:**
- User profile view/edit page
- Change password functionality
- Update user information
- Profile picture upload
- Email verification
- Two-factor authentication (if backend supports)
- Account settings
- Notification preferences

**Backend Endpoints Available:**
```
GET    /api/account/profile
PUT    /api/account/profile
POST   /api/account/change-password
```

**Impact:** Users cannot manage their own account information.

---

## Implementation Roadmap

### Phase 1: Core Attendance System (Weeks 1-3) 🔴 **CRITICAL**

**Goal:** Enable basic attendance tracking functionality

1. **Attendance API Service** (Week 1)
   - Create `src/api/attendance.js`
   - Implement all attendance endpoints
   - Add error handling and validation

2. **Attendance Store** (Week 1)
   - Create `src/stores/attendanceStore.js`
   - State management for attendance records
   - Actions for CRUD operations

3. **Attendance Recording UI** (Week 2)
   - Create attendance marking interface
   - Bulk attendance recording
   - Session-based attendance view
   - Student attendance status indicators

4. **Student Enrollment Management** (Week 2-3)
   - Create `src/api/enrollments.js`
   - Create `src/stores/enrollmentStore.js`
   - Enrollment management UI
   - Bulk enrollment operations

5. **Schedule Management** (Week 3)
   - Create `src/api/schedules.js`
   - Create `src/stores/scheduleStore.js`
   - Schedule creation and management UI
   - Timetable views

**Deliverables:**
- ✅ Functional attendance recording
- ✅ Student enrollment in sections
- ✅ Schedule management
- ✅ Basic timetable view

---

### Phase 2: Complete Management Features (Weeks 4-6) 🟡 **HIGH PRIORITY**

**Goal:** Complete all resource management capabilities

6. **Student Management UI** (Week 4)
   - Student list view with search/filter
   - Student CRUD operations
   - Student profile view
   - Soft delete/restore functionality

7. **Classroom Management UI** (Week 4-5)
   - Classroom CRUD operations
   - Classroom assignment interface
   - Availability tracking
   - Capacity management

8. **Subject Management** (Week 5)
   - Create `src/api/subjects.js`
   - Subject CRUD operations
   - Subject-course relationships
   - Subject assignment to sections

9. **Enhanced Instructor Management** (Week 5-6)
   - Instructor CRUD operations
   - Instructor assignment to sections
   - Workload overview
   - Instructor profile management

**Deliverables:**
- ✅ Complete student management
- ✅ Complete classroom management
- ✅ Subject management system
- ✅ Enhanced instructor features

---

### Phase 3: Advanced Features (Weeks 7-9) 🟢 **MEDIUM PRIORITY**

**Goal:** Add advanced functionality and integrations

10. **Real Reports Integration** (Week 7)
    - Connect reports to real backend data
    - Implement all report endpoints
    - Add export functionality (PDF, Excel)
    - Advanced filtering and date ranges

11. **QR Code Attendance** (Week 8)
    - QR code generation for sessions
    - QR code display interface
    - Mobile-friendly scanning UI
    - QR code validation and security

12. **User Profile Management** (Week 9)
    - Profile view/edit pages
    - Password change functionality
    - Account settings
    - Profile picture upload

**Deliverables:**
- ✅ Data-driven reports and analytics
- ✅ QR code attendance system
- ✅ User profile management

---

### Phase 4: Polish & Optimization (Week 10+) 🔵 **LOW PRIORITY**

**Goal:** Enhance user experience and performance

13. **Token Management Dashboard**
    - Active sessions view
    - Token revocation
    - Security audit logs

14. **Performance Optimization**
    - Lazy loading
    - Caching strategies
    - API call optimization

15. **Enhanced UX**
    - Loading states
    - Error boundaries
    - Offline support
    - Progressive Web App features

**Deliverables:**
- ✅ Admin security controls
- ✅ Optimized performance
- ✅ Enhanced user experience

---

## Summary Statistics

### Current Implementation Status

| Category | Total Features | Implemented | Missing | Completion % |
|----------|---------------|-------------|---------|--------------|
| **Attendance** | 10 | 0 | 10 | 0% |
| **Enrollment** | 7 | 0 | 7 | 0% |
| **Schedules** | 9 | 0 | 9 | 0% |
| **Students** | 10 | 2 | 8 | 20% |
| **Instructors** | 9 | 2 | 7 | 22% |
| **Classrooms** | 7 | 2 | 5 | 29% |
| **Subjects** | 6 | 0 | 6 | 0% |
| **Reports** | 10 | 3 | 7 | 30% |
| **QR Codes** | 7 | 0 | 7 | 0% |
| **User Profile** | 8 | 1 | 7 | 13% |
| **Token Mgmt** | 7 | 0 | 7 | 0% |
| **TOTAL** | **90** | **10** | **80** | **11%** |

### Priority Breakdown

- 🔴 **Critical:** 10 features (Attendance system)
- 🟡 **High:** 25 features (Enrollment, Schedules, Core Management)
- 🟢 **Medium:** 30 features (Enhanced Management, Subjects, Classrooms)
- 🔵 **Low:** 25 features (Reports, QR, Profiles, Token Management)

---

## Critical Next Steps

### Immediate Action Required

1. **Start with Attendance Recording** - This is the core functionality
   - Without attendance recording, the system cannot fulfill its primary purpose
   - Sessions can be created and managed, but no actual attendance data can be captured

2. **Implement Student Enrollment** - Required for attendance
   - Cannot record attendance without knowing which students are in which sections
   - Prerequisite for meaningful attendance tracking

3. **Add Schedule Management** - Required for session planning
   - Properly organize when and where classes meet
   - Essential for instructors to plan sessions

### Recommended First Sprint (2 weeks)

**Week 1:**
- Create `src/api/attendance.js` with all attendance endpoints
- Create `src/stores/attendanceStore.js` for state management
- Design attendance recording UI mockups

**Week 2:**
- Implement attendance recording interface
- Add student enrollment API and UI
- Test end-to-end attendance flow

---

## Notes

- The backend is **fully functional** and ready to support all these features
- The frontend has good infrastructure (Pinia stores, Vue Router, API service pattern)
- Most missing features follow the same pattern as existing features (Users, Courses, Sections)
- The biggest gap is **attendance recording** - the core purpose of the system

---

**Last Updated:** 2025-11-20  
**Analyzed By:** AI Assistant  
**Backend Reference:** ASP.NET Core 9.0 Attendance Monitoring System README

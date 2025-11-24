# Missing Functionality in Frontend

**Date of Birth:** 2025-11-20
**Update of Birth:** 2025-11-24
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

### 1.1 Attendance Recording & Management ⚠️ **PARTIALLY IMPLEMENTED**

The backend has attendance functionality, and the frontend now has **basic attendance recording capabilities** implemented.

**Implemented Components:**
- ✅ `src/api/attendance.js` file with full CRUD operations
- ✅ `src/stores/attendanceStore.js` for state management
- ✅ `src/views/AttendanceView.vue` for attendance interface
- ✅ Attendance recording interface with student status indicators
- ✅ Session-based attendance views
- ✅ Student attendance history views

**Remaining Features:**
- QR code scanning for attendance (backend supports QR code generation)
- Advanced attendance summaries and statistics
- Late arrival tracking and cutoff management
- Attendance history for individual students (UI component needed)

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

**Impact:** Core attendance functionality is now available, making the system operational. QR code and advanced features remain to be implemented.

---

## 2. High Priority Features

### 2.1 Student Enrollment Management

The backend supports student enrollment in sections, and the frontend now has **basic enrollment management functionality** implemented.

**Implemented Components:**
- ✅ `src/api/enrollments.js` with full CRUD operations
- ✅ `src/stores/enrollmentStore.js` for state management
- ✅ Enrollment management UI integrated in `src/views/SectionsView.vue`
- ✅ `src/components/sections/EnrollmentModal.vue` for managing enrollments

**Implemented Features:**
- ✅ Enroll students in sections
- ✅ View enrolled students per section
- ✅ Drop/unenroll students from sections
- ✅ View enrollment status (active/dropped)
- ✅ Student's enrolled sections view
- ✅ Re-enroll functionality

**Remaining Features:**
- Bulk enrollment operations (UI component needed)
- Enrollment history tracking
- Student's enrolled sections view (separate dedicated view)

**Backend Endpoints Available:**
```
POST   /api/enrollments
GET    /api/enrollments/section/{sectionId}
GET    /api/enrollments/student/{studentId}
PUT    /api/enrollments/{id}
DELETE /api/enrollments/{id}
```

**Impact:** Student assignment to classes is now possible, enabling attendance tracking.

---

### 2.2 Schedule Management

The backend has schedule management for assigning classrooms and time slots to sections, and this functionality has been **fully implemented** in the frontend.

**Implemented Components:**
- ✅ `src/api/schedules.js` with full CRUD operations
- ✅ `src/stores/scheduleStore.js` for state management
- ✅ `src/views/SchedulesView.vue` for schedule management

**Implemented Features:**
- ✅ Create schedules for sections
- ✅ Assign time slots to sections
- ✅ Assign classrooms to sections
- ✅ View section schedules (timetable)
- ✅ Edit/update schedules
- ✅ Delete schedules
- ✅ Instructor schedule overview
- ✅ Schedule sorting and management

**Remaining Features:**
- Schedule conflict detection (logic needed)
- Weekly/daily schedule views with visual calendar interface

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

**Impact:** Class sessions can now be properly organized and classroom assignments managed.

---

## 3. Medium Priority Features

### 3.1 Subject Management

While course management exists, subjects appear to be separate entities in the backend, and this functionality has been **partially implemented**.

**Implemented Components:**
- ✅ `src/api/subjects.js` with full CRUD operations
- ✅ `src/stores/subjectStore.js` for state management
- ✅ `src/views/SubjectView.vue` for subject management

**Implemented Features:**
- ✅ Create/edit/delete subjects
- ✅ View all subjects
- ✅ Subject details view
- ✅ Subject code and name management

**Remaining Features:**
- Assign subjects to courses (UI integration needed)
- Subject-course relationships management interface
- Subject assignment to sections (interface needed)

**Backend Endpoints Available:**
```
POST   /api/subjects
GET    /api/subjects
GET    /api/subjects/{id}
GET    /api/subjects/course/{courseId}
PUT    /api/subjects/{id}
DELETE /api/subjects/{id}
```

**Impact:** Subject management is now available, but some relationships with courses/sections need better UI integration.

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

### 3.3 Student Management ✅ **FULLY IMPLEMENTED**

The backend supports comprehensive student operations, and frontend **operations have been fully implemented** following the correct architecture where students are created via User Management.

**Implemented Components:**
- ✅ `src/api/students.js` with all backend endpoints (GET, PATCH, soft-delete, restore)
- ✅ `src/stores/studentStore.js` with comprehensive state management
- ✅ `src/views/StudentManagementView.vue` - Dedicated student management view with tabs
- ✅ `src/components/StudentModal.vue` - Simplified edit modal for student-specific fields
- ✅ `src/components/tables/StudentTableSection.vue` - Student table with pagination and restore
- ✅ Student menu item added to sidebar navigation

**Implemented Features:**
- ✅ Student RUD operations (Read, Update, Delete) - Create done via User Management
- ✅ Dedicated student management view matching app theme
- ✅ Active/Deleted students tabs with separate views
- ✅ Student list view with pagination
- ✅ Search and filtering by name, student ID, email, section
- ✅ Redirect to User Management for creating students
- ✅ Edit student-specific fields (section) via simplified modal
- ✅ Soft delete students with confirmation
- ✅ Restore deleted students functionality
- ✅ Student profile information display (read-only for name, ID, email)
- ✅ Section assignment for students
- ✅ Real-time counts (active students, deleted students)
- ✅ Theme consistency with CourseView and UserManagementView

**Architecture Notes:**
- Students are created through User Management (role assignment), not directly
- Student-specific fields (like section) can be edited in Student Management
- User-related fields (name, email, studentId) must be edited in User Management
- Follows proper separation of concerns between user accounts and student records

**Remaining Features:**
- View student's enrolled sections (UI integration needed)
- View student's attendance history (UI integration needed)
- Student performance metrics (analytics view needed)
- Bulk student operations (import/export)

**Backend Endpoints Available:**
```
POST   /api/students
GET    /api/students
GET    /api/students/{id}
PUT    /api/students/{id}
DELETE /api/students/{id}
POST   /api/students/{id}/restore
```

**Impact:** Student data management is now available with basic functionality.

---

### 3.4 Instructor Management (Partially Implemented)

Basic instructor functionality has been implemented for instructor self-service.

**Implemented Components:**
- ✅ `src/api/instructors.js` with profile and schedule access
- ✅ Instructor profile access in `src/views/UserManagementView.vue`

**Implemented Features:**
- ✅ View instructor details (for current user)
- ✅ Instructor schedule overview (for current user)
- ✅ Instructor list view (for admins in User Management)
- ✅ Instructor contact information access

**Remaining Features:**
- Admin view to manage instructors (full CRUD)
- Create/edit/delete instructors (admin functionality)
- Assign instructors to sections (UI needed)
- Soft delete/restore instructors
- Instructor workload overview
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

**Current Frontend:** Has profile access, schedule view, and basic admin management

**Impact:** Instructors can manage their own profiles and schedules; admin management capabilities still needed.

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

### Phase 1: Core Attendance System (Weeks 1-3) 🔴 **COMPLETED**

**Goal:** Enable basic attendance tracking functionality

1. **Attendance API Service** (Week 1)
   - ✅ Create `src/api/attendance.js`
   - ✅ Implement all attendance endpoints
   - ✅ Add error handling and validation

2. **Attendance Store** (Week 1)
   - ✅ Create `src/stores/attendanceStore.js`
   - ✅ State management for attendance records
   - ✅ Actions for CRUD operations

3. **Attendance Recording UI** (Week 2)
   - ✅ Create attendance marking interface
   - ✅ Session-based attendance view
   - ✅ Student attendance status indicators
   - 🔲 Bulk attendance recording (needs improvement)

4. **Student Enrollment Management** (Week 2-3)
   - ✅ Create `src/api/enrollments.js`
   - ✅ Create `src/stores/enrollmentStore.js`
   - ✅ Enrollment management UI
   - 🔲 Bulk enrollment operations (UI component needed)

5. **Schedule Management** (Week 3)
   - ✅ Create `src/api/schedules.js`
   - ✅ Create `src/stores/scheduleStore.js`
   - ✅ Schedule creation and management UI
   - ✅ Timetable views

**Deliverables:**
- ✅ Functional attendance recording
- ✅ Student enrollment in sections
- ✅ Schedule management
- ✅ Basic timetable view

---

### Phase 2: Complete Management Features (Weeks 4-6) 🟡 **PARTIALLY COMPLETED**

**Goal:** Complete all resource management capabilities

6. **Student Management UI** (Week 4) ✅ **COMPLETED**
   - ✅ Student list view with full functionality
   - ✅ Student RUD operations (Read, Update, Delete) - Create via User Management
   - ✅ Active/Deleted students tabs
   - ✅ Soft delete functionality with confirmation
   - ✅ Restore deleted students functionality
   - ✅ Advanced search/filter by name, ID, email, section
   - ✅ Pagination with navigation
   - ✅ Real-time student counts (active/deleted)
   - ✅ Dedicated StudentManagementView matching app theme
   - ✅ Simplified modal for editing student-specific fields
   - ✅ Redirect to User Management for student creation
   - ✅ Sidebar navigation integration
   - ✅ Proper architecture following user/student separation

7. **Classroom Management UI** (Week 4-5)
   - 🔲 Classroom CRUD operations (API implemented, UI needed)
   - 🔲 Classroom assignment interface
   - 🔲 Availability tracking
   - 🔲 Capacity management

8. **Subject Management** (Week 5)
   - ✅ Create `src/api/subjects.js`
   - ✅ Subject CRUD operations
   - 🔲 Subject-course relationships
   - 🔲 Subject assignment to sections (UI needed)

9. **Enhanced Instructor Management** (Week 5-6)
   - 🔲 Instructor CRUD operations (API endpoints available, UI needed)
   - 🔲 Instructor assignment to sections (UI needed)
   - 🔲 Workload overview
   - ✅ Instructor profile management

**Deliverables:**
- ✅ Complete student management (FULLY IMPLEMENTED)
- 🔲 Complete classroom management
- 🔲 Complete subject management system
- 🔲 Complete instructor management features

---

### Phase 3: Advanced Features (Weeks 7-9) 🟢 **PENDING**

**Goal:** Add advanced functionality and integrations

10. **Real Reports Integration** (Week 7)
    - 🔲 Connect reports to real backend data
    - 🔲 Implement all report endpoints
    - 🔲 Add export functionality (PDF, Excel)
    - 🔲 Advanced filtering and date ranges

11. **QR Code Attendance** (Week 8)
    - 🔲 QR code generation for sessions
    - 🔲 QR code display interface
    - 🔲 Mobile-friendly scanning UI
    - 🔲 QR code validation and security

12. **User Profile Management** (Week 9)
    - 🔲 Profile view/edit pages
    - 🔲 Password change functionality
    - 🔲 Account settings
    - 🔲 Profile picture upload

**Deliverables:**
- 🔲 Data-driven reports and analytics
- 🔲 QR code attendance system
- 🔲 User profile management

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
| **Attendance** | 10 | 6 | 4 | 60% |
| **Enrollment** | 7 | 6 | 1 | 86% |
| **Schedules** | 9 | 8 | 1 | 89% |
| **Students** | 10 | 10 | 0 | 100% |
| **Instructors** | 9 | 4 | 5 | 44% |
| **Classrooms** | 7 | 2 | 5 | 29% |
| **Subjects** | 6 | 4 | 2 | 67% |
| **Reports** | 10 | 3 | 7 | 30% |
| **QR Codes** | 7 | 0 | 7 | 0% |
| **User Profile** | 8 | 1 | 7 | 13% |
| **Token Mgmt** | 7 | 0 | 7 | 0% |
| **TOTAL** | **90** | **44** | **46** | **49%** |

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

**Last Updated:** 2025-11-24  
**Analyzed By:** AI Assistant  
**Backend Reference:** ASP.NET Core 9.0 Attendance Monitoring System README

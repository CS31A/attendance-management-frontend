# ACLC Attendance Monitoring System - Frontend

A modern, responsive web application for managing student attendance at ACLC. Built with Vue 3, this frontend provides an intuitive interface for instructors to track attendance, students to check in, and administrators to manage the system.

## 🎯 Overview

The ACLC Attendance Monitoring System is a comprehensive solution designed to streamline attendance tracking with precision and care. This frontend application communicates with a .NET backend API to provide real-time attendance monitoring, QR code-based check-ins, and detailed analytics.

## ✨ Features

- **Role-Based Access Control**: Separate interfaces for Students, Instructors, and Administrators
- **QR Code Attendance**: Quick and efficient attendance marking via QR code scanning
- **Real-Time Updates**: Live attendance updates using SignalR
- **Session Management**: Create, manage, and monitor attendance sessions
- **Analytics Dashboard**: Visual representation of attendance data with Chart.js
- **Responsive Design**: Optimized for desktop and mobile devices
- **Secure Authentication**: JWT-based authentication with token management
- **Student Enrollment**: Manage student enrollments and section assignments
- **Classroom Management**: Track and organize classrooms and sessions

## 🛠️ Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Charts**: [Chart.js](https://www.chartjs.org/) + [Vue-ChartJS](https://vue-chartjs.org/)
- **Icons**: [Lucide Vue Next](https://lucide.dev/)
- **Linting**: [ESLint](https://eslint.org/) with [@antfu/eslint-config](https://github.com/antfu/eslint-config)

## 📋 Prerequisites

- **Node.js**: `^20.19.0` or `>=22.12.0`
- **npm** or **bun**: Latest version recommended

## 🚀 Getting Started

### 1. Clone the Repository

```sh
git clone <repository-url>
cd attendance-management-frontend
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```sh
cp .env.example .env
```

Edit the `.env` file with your API endpoint:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 4. Run Development Server

```sh
npm run dev
```

The application will be available at `http://localhost:5173`

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Auto-fix ESLint issues |

## 📁 Project Structure

```
attendance-management-frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API service modules (12 files)
│   ├── assets/         # Images, styles, and other assets
│   ├── components/     # Reusable Vue components (45 files)
│   ├── router/         # Vue Router configuration
│   ├── stores/         # Pinia state management stores (13 files)
│   ├── utils/          # Utility functions and helpers
│   ├── views/          # Page-level components (16 views)
│   ├── App.vue         # Root component
│   └── main.js         # Application entry point
├── .env.example        # Environment variables template
├── index.html          # HTML entry point
├── package.json        # Project dependencies and scripts
├── vite.config.js      # Vite configuration
└── eslint.config.js    # ESLint configuration
```

## 🔧 Configuration

### Vite Configuration

The `vite.config.js` includes:
- Vue plugin with Vue DevTools
- Path aliases for cleaner imports
- Development server configuration
- Build optimization settings

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api` |

## 🎨 Development Guidelines

### Code Style

This project uses [@antfu/eslint-config](https://github.com/antfu/eslint-config) for consistent code styling:

- Use Composition API with `<script setup>`
- Follow Vue 3 best practices
- Use TypeScript-style imports where applicable
- Keep components focused and reusable

### Component Organization

- **Components**: Reusable UI components
- **Views**: Page-level components tied to routes
- **Stores**: Pinia stores for state management
- **API**: Service modules for backend communication

## 🔐 Security Features

- Content Security Policy (CSP) configured in `index.html`
- JWT token-based authentication
- Secure API communication
- XSS protection through Vue's built-in sanitization

## 🌐 Deployment

### Build for Production

```sh
npm run build
```

The optimized production build will be in the `dist/` directory.

### Preview Production Build

```sh
npm run preview
```

### Deployment Targets

The application can be deployed to:
- AWS Elastic Beanstalk
- Netlify
- Vercel
- Any static hosting service

Ensure the `VITE_API_BASE_URL` environment variable points to your production API endpoint.

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Run `npm run lint:fix` before committing
3. Test your changes thoroughly
4. Update documentation as needed


## 👥 Authors

- **Me - Neik** - Initial development

## 📄 License

This project is private and proprietary.

---

**Note**: This is the frontend application. Ensure the backend API is running and accessible at the configured `VITE_API_BASE_URL` for full functionality.

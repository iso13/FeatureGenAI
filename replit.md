# AI-Powered Cucumber Feature Generator

## Overview

This is a full-stack web application that generates Cucumber feature files using AI assistance. The application helps developers create Behavior-Driven Development (BDD) test scenarios by providing an intelligent platform that can generate, analyze, and manage Cucumber features through OpenAI integration.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with dark/light theme support
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Drag & Drop**: Hello Pangea DnD for interactive feature management

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based auth with bcrypt password hashing
- **Session Storage**: PostgreSQL-backed session store

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle with schema-first approach
- **Migrations**: Drizzle Kit for database schema management
- **Session Store**: PostgreSQL sessions via connect-pg-simple
- **Hierarchical Organization**: Projects → Epics → Features structure for portfolio management

## Key Components

### AI Integration
- **OpenAI API**: GPT-4 integration for feature generation and complexity analysis
- **Domain-Specific Prompts**: Specialized prompts for different business domains (AI, finance, ecommerce, etc.)
- **Complexity Analysis**: AI-powered scenario complexity scoring with implementation recommendations

### Feature Management
- **CRUD Operations**: Full feature lifecycle management (create, read, update, delete, restore)
- **Lifecycle Tracking**: Multi-stage feature progression (draft → review → approved → implemented → tested → deployed)
- **Archive System**: Soft delete with restore capabilities
- **Search & Filter**: Advanced filtering by domain, status, and complexity
- **Hierarchical Organization**: Three-tier structure (Projects → Epics → Features) for portfolio management
- **Complexity Rollup**: Aggregate complexity metrics across epics and projects

### User Authentication
- **Registration/Login**: Email-based authentication with password hashing
- **Session Management**: Secure session handling with configurable expiration
- **Admin System**: Admin user creation and management capabilities

### Analytics & Monitoring
- **Event Tracking**: Generation success/failure tracking with error logging
- **Usage Analytics**: Feature generation patterns and user behavior insights
- **Performance Metrics**: Response times and API usage monitoring

## Data Flow

1. **Feature Generation Flow**:
   - User submits story and configuration → OpenAI API generates Gherkin content → Database storage → UI update
   
2. **Complexity Analysis Flow**:
   - Generated feature → AI complexity analysis → JSON storage → Visual complexity indicators

3. **Authentication Flow**:
   - Login credentials → bcrypt verification → session creation → protected route access

4. **Lifecycle Management Flow**:
   - Feature state change → stage validation → database update → history tracking

## External Dependencies

### Core Dependencies
- **OpenAI**: Feature generation and complexity analysis
- **Neon/PostgreSQL**: Primary database with serverless scaling
- **Radix UI**: Accessible UI component primitives
- **TanStack Query**: Server state management and caching

### Development Dependencies
- **Vite**: Fast build tooling with HMR
- **Vitest**: Unit and integration testing framework
- **Testing Library**: Component testing utilities
- **Drizzle Kit**: Database migration and schema management

### Authentication & Security
- **bcryptjs**: Password hashing and validation
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations run during deployment

### Environment Configuration
- **Development**: Local development with hot reload
- **Production**: Cloud Run deployment with environment variables
- **Database**: Neon PostgreSQL with SSL connections

### Scaling Considerations
- **Serverless Database**: Neon provides automatic scaling
- **Session Storage**: PostgreSQL-backed for horizontal scaling
- **Static Assets**: Frontend assets served via CDN-ready build

## Changelog

```
Changelog:
- June 26, 2025. Implemented Role Approval Workflow System
  - Added role selection to registration with security-first approach
  - Created approval workflow for sensitive roles (product_manager requires admin approval)
  - Implemented role approval requests database table and API endpoints
  - Built admin interface for reviewing and approving role requests
  - Added automatic role assignment after approval with notification system
  - Enhanced registration flow with appropriate messaging for approval-required roles
- June 26, 2025. Implemented Complete User Management System
  - Added secure user deletion API endpoint with proper permission checks
  - Implemented cascading deletion handling for foreign key constraints
  - Added delete confirmation dialogs in user management interface
  - Enhanced user cleanup by preserving data integrity (nullifying references instead of deleting related records)
  - Successfully cleaned up test users from the system
  - Fixed user creation functionality by replacing CommonJS require with ES6 imports
  - Resolved "require is not defined" error in user creation endpoint
- June 26, 2025. Enhanced Password Reset User Experience
  - Added prominent "Forgot your password?" link to login form for easy access
  - Improved error message handling with user-friendly text instead of technical HTTP codes
  - Enhanced authentication error displays with clean toast notifications
  - Fixed TypeScript compilation errors preventing frontend functionality
  - Integrated forgot password functionality seamlessly into authentication flow
- June 26, 2025. Implemented Comprehensive Password Reset System
  - Added forgot password functionality with secure token-based reset
  - Created password reset database table with expiration and usage tracking
  - Implemented backend API endpoints for password reset flow
  - Added frontend forms for forgot password and reset password
  - Enhanced authentication system with proper admin access controls
  - Updated user profile management (cleaned up duplicate admin accounts, set personal name "David Tran", updated password to "genghis09")
- June 26, 2025. Enhanced User System with Personal Names
  - Added first and last name requirements for all user accounts
  - Updated registration and user creation forms with name fields
  - Enhanced header display to show full names instead of email addresses
  - Updated user management interface with personal name display
  - Modified database schema to include firstName and lastName columns
- June 25, 2025. Implemented Comprehensive Role-Based Access Control System
  - Created 6 user roles: Admin, Product Manager, Business Analyst, Developer, Tester, Stakeholder
  - Added granular permissions for feature management, project control, and analytics access
  - Integrated role badges in navigation header and throughout UI
  - Added permission guards for sensitive operations (delete, team config, etc.)
  - Updated database schema with role column and role-based filtering
- June 25, 2025. Enhanced Complexity Analysis with Team Configuration System
  - Added comprehensive team configuration modal for personalized estimates
  - Implemented dynamic estimation algorithms based on team composition and experience
  - Created team-aware story point calculations, time estimates, and developer assignments
  - Added accuracy disclaimers distinguishing generic vs personalized predictions
  - Restored multi-stage complexity analysis progress loader with proper timing synchronization
  - Fixed progress bar timing to match actual OpenAI API response duration
- June 20, 2025. Enhanced Portfolio Management with Drag-and-Drop Interface
  - Rebuilt Projects page as main portfolio management hub with visual hierarchy
  - Implemented drag-and-drop functionality for organizing features between epics and epics between projects
  - Added collapsible project views with complexity rollup analytics
  - Created unassigned sections for features and epics not yet organized
  - Enhanced epic selection in feature creation and editing workflows on Home page
- June 20, 2025. Added Epic and Project hierarchy system for portfolio management
  - Created Projects and Epics tables with proper relationships
  - Implemented full CRUD operations for Projects and Epics
  - Added hierarchical organization: Projects → Epics → Features
  - Built comprehensive project management interface with complexity rollup
  - Integrated automatic complexity analysis during feature generation
- June 15, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
UI Design preference: Softer, warmer colors for light mode instead of harsh white backgrounds.
```
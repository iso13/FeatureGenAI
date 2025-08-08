# Feature Generator Test Suite

This comprehensive test suite covers all critical aspects of the Feature Generator framework with unit, integration, and component tests.

## Test Categories

### 1. Utility Tests (`tests/utils/`)
- **Scenario Counter**: Tests the Gherkin scenario parsing and counting functionality
- **Form Validation**: Validates all form schemas including features, domains, lifecycle stages, email, and password validation

### 2. Server Tests (`tests/server/`)
- **Storage Layer**: Tests PostgreSQL storage operations for features, users, and analytics
- **OpenAI Integration**: Tests AI-powered feature generation and complexity analysis
- **Authentication**: Tests user registration, login, password hashing, and session management

### 3. Component Tests (`tests/components/`)
- **Feature List**: Tests feature display, selection, filtering, and user interactions
- **Scenario Complexity**: Tests complexity analysis visualization and recommendations display

### 4. Integration Tests (`tests/integration/`)
- **Feature Workflow**: End-to-end testing of complete feature generation, storage, and analysis flow
- **Lifecycle Management**: Tests feature archiving, restoration, and state transitions
- **Error Handling**: Tests graceful handling of API failures and data validation errors

## Key Testing Scenarios

### Feature Generation Flow
✅ Complete end-to-end feature creation from OpenAI generation to database storage  
✅ Scenario count validation and automatic synchronization  
✅ Domain validation across all supported categories  
✅ Complexity analysis with AI-powered insights  

### Data Integrity
✅ Form validation with comprehensive schema testing  
✅ Database operations with proper error handling  
✅ Authentication security with password hashing  
✅ Session management and user authorization  

### User Interface
✅ Feature list rendering and interaction handling  
✅ Complexity visualization with accurate metrics  
✅ Real-time updates and state management  
✅ Responsive design and accessibility compliance  

### Error Scenarios
✅ OpenAI API rate limiting and failure recovery  
✅ Database connection issues and transaction rollbacks  
✅ Invalid input validation and user feedback  
✅ Network connectivity and timeout handling  

## Test Configuration

- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: Text, JSON, and HTML reporting
- **Mocking**: Comprehensive mocks for external dependencies

## Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test category
npm test tests/server/
npm test tests/components/
npm test tests/integration/
```

## Test Data Standards

All tests use realistic, production-like data scenarios:
- Authentic Gherkin feature syntax
- Real-world user stories and scenarios
- Valid domain classifications
- Proper lifecycle stage transitions
- Security-compliant authentication flows

## Continuous Testing

The test suite is designed for:
- Pre-commit validation
- CI/CD pipeline integration
- Regression testing
- Performance monitoring
- Security vulnerability detection

This testing framework ensures the Feature Generator maintains high quality, reliability, and security standards across all components and user workflows.
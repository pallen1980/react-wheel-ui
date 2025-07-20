# Test Coverage Setup Guide

## Overview

This document explains how to use the test coverage system that has been configured for The Wheel application.

## Quick Start

### Generate Coverage Report
```bash
npm run test:coverage
```

### Analyze Coverage Gaps
```bash
npm run coverage:analyze
```

### View Interactive Coverage Report
```bash
npm run test:coverage
# Then open: ./coverage/index.html in your browser
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run test:coverage` | Generate coverage report and run all tests |
| `npm run test:coverage:watch` | Run tests in watch mode with coverage |
| `npm run test:coverage:ui` | Run tests with interactive UI and coverage |
| `npm run coverage:analyze` | Analyze coverage gaps and provide recommendations |

## Coverage Configuration

### Thresholds
- **Global minimum**: 70% for all metrics (statements, branches, functions, lines)
- **Critical components**: 85% for all metrics
  - `src/store/**` - Redux state management
  - `src/services/**` - API services and data persistence

### Coverage Provider
- **Provider**: V8 (Node.js built-in coverage)
- **Reporters**: Text, JSON, HTML, LCOV
- **Output Directory**: `./coverage/`

### Exclusions
The following are excluded from coverage analysis:
- `node_modules/**`
- `dist/**` and build artifacts
- `**/*.d.ts` - TypeScript definitions
- `**/*.config.{js,ts}` - Configuration files
- `src/main.tsx` - Application entry point
- `src/test/**` - Test utilities and setup
- `**/*.test.{ts,tsx}` - Test files themselves

## Understanding Coverage Reports

### Text Report (Console)
Shows a table with coverage percentages for each file:
- **% Stmts**: Statement coverage
- **% Branch**: Branch coverage (if/else, switch cases)
- **% Funcs**: Function coverage
- **% Lines**: Line coverage
- **Uncovered Line #s**: Specific lines not covered by tests

### HTML Report
Interactive browser-based report at `./coverage/index.html`:
- Click on files to see line-by-line coverage
- Red lines are not covered
- Green lines are covered
- Yellow lines are partially covered

### Coverage Analysis Script
Custom analysis tool that provides:
- Summary of files meeting/failing thresholds
- Identification of critical vs. regular files
- Prioritized list of coverage gaps
- Actionable recommendations

## Current Coverage Status

### Well-Tested Components ✅
- **Redux Store**: High coverage for state management logic
- **Services**: Good coverage for API integration

### Areas Needing Coverage ⚠️
- **React Components**: Most UI components have 0% coverage
- **Authentication**: Auth providers and protected routes
- **Firebase Integration**: Configuration and OAuth flows

## Best Practices

### Writing Tests for Coverage
1. **Focus on Business Logic**: Prioritize testing core functionality
2. **Test Edge Cases**: Error conditions, boundary values, empty states
3. **Mock External Dependencies**: Isolate units under test
4. **Test User Interactions**: Use React Testing Library for component tests

### Improving Coverage
1. **Start with Critical Files**: Address store/ and services/ first
2. **Add Component Tests**: Test user interactions and rendering logic
3. **Integration Tests**: Test complete user workflows
4. **Error Handling**: Test failure scenarios and recovery

### Example Test Structure
```typescript
// Component test example
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const mockHandler = vi.fn();
    render(<ComponentName onAction={mockHandler} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

## Continuous Integration

### Pre-commit Checks
- Coverage thresholds are enforced
- New code should maintain or improve coverage
- Failed builds if coverage drops below minimums

### Monitoring
- Run `npm run coverage:analyze` regularly
- Track coverage trends over time
- Review coverage reports during code reviews

## Troubleshooting

### Common Issues

#### "Coverage file not found"
```bash
# Solution: Generate coverage first
npm run test:coverage
npm run coverage:analyze
```

#### Low line coverage despite good test coverage
This can happen with TypeScript interfaces and type-only files. Focus on statement and function coverage for these files.

#### Tests passing but coverage failing
Check that your tests are actually exercising the code paths. Use the HTML report to see which lines aren't covered.

## Next Steps

1. **Phase 1**: Improve critical component coverage (store/, services/)
2. **Phase 2**: Add component tests for main UI components
3. **Phase 3**: Integration tests for complete user workflows
4. **Phase 4**: Consider increasing thresholds as coverage improves

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Strategy Document](./testing-strategy.md)
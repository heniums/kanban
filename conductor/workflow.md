# Workflow

## Development Methodology: Test-Driven Development

All feature implementation follows a strict TDD cycle: write tests first, verify they fail, implement the feature, verify tests pass, refactor.

## Task Structure

Each task in a plan follows this pattern:
1. Write tests for the feature/endpoint/component
2. Implement the feature
3. Verify all tests pass
4. Commit the change

## Commit Strategy

- Commit after every completed task
- Commit messages: imperative mood, present tense
- Format: `<type>(<scope>): <description>`

## Test Coverage

- Minimum 80% code coverage across the project
- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows

## Code Review

- All changes must pass lint, typecheck, and tests before being considered complete

## Phase Completion Verification and Checkpointing Protocol

After completing all tasks in a phase:
1. Verify all tests pass: `npm test`
2. Verify type checking passes: `npm run typecheck`
3. Verify linting passes: `npm run lint`
4. Run the application and manually verify the phase deliverables
5. Fix any issues before proceeding to the next phase

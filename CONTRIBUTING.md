# Contributing to Jpdz Todo

Thank you for your interest in contributing to Jpdz Todo! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)

## Code of Conduct

This project adheres to a code of professionalism and respect. Please be considerate and constructive in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/vs-code-style-project-tasks.git`
3. Add upstream remote: `git remote add upstream https://github.com/ORIGINAL_OWNER/vs-code-style-project-tasks.git`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js v18.20.5 or higher (see `.nvmrc`)
- npm 9.x or higher
- VS Code 1.85.0 or higher

### Installation

```bash
# Install dependencies
npm install

# Build the extension and Angular app
npm run build:all

# Watch for changes (extension)
npm run watch

# Serve Angular app for development
npm run dev
```

### Running the Extension

1. Press `F5` in VS Code to open Extension Development Host
2. Or use "Run and Debug" panel → "Run Extension"

## Project Structure

```
src/
├── extension.ts              # Main extension entry point
├── app.component.ts          # Root Angular component
├── components/               # Angular components
│   ├── main-view.component.ts
│   └── sidebar.component.ts
├── services/                 # Business logic services
│   ├── store.service.ts
│   └── ai.service.ts
└── utils/                    # Utility functions
    ├── constants.ts
    ├── date-utils.ts
    ├── error-handler.ts
    ├── logger.ts
    └── validators.ts
```

## Development Workflow

### Making Changes

1. **Write code** following our [coding standards](#coding-standards)
2. **Test locally** in Extension Development Host
3. **Run builds**: `npm run build:all`
4. **Check for errors**: Look for TypeScript errors and warnings

### Commit Messages

Use conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

**Examples:**
```
feat(tasks): add bulk delete functionality
fix(sync): prevent race condition in file watcher
docs(readme): update installation instructions
```

## Testing

### Manual Testing

1. Open Extension Development Host (`F5`)
2. Test the functionality you changed
3. Verify no regressions in existing features

### Automated Testing (Coming Soon)

```bash
# Run unit tests
npm test

# Run extension tests
npm run test:ext
```

## Submitting Changes

### Pull Request Process

1. **Update your branch** with latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request** on GitHub

4. **PR Checklist**:
   - [ ] Code builds without errors (`npm run build:all`)
   - [ ] Tested in Extension Development Host
   - [ ] Updated documentation if needed
   - [ ] Follows coding standards
   - [ ] Clear commit messages

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots to demonstrate UI changes

## Related Issues
Fixes #(issue number)
```

## Coding Standards

### TypeScript

- **Strict mode**: All TypeScript strict checks enabled
- **No `any`**: Avoid using `any` type; use proper types or `unknown`
- **Explicit types**: Define return types for functions
- **Naming conventions**:
  - Classes: `PascalCase`
  - Functions/methods: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private members: prefix with `_`

### File Organization

- One main export per file
- Group imports: external → VS Code → internal → types
- Use barrel exports (`index.ts`) for clean imports

### Best Practices

1. **Error Handling**: Always handle errors gracefully with user-facing messages
2. **Logging**: Use `Logger` utility, not `console.*`
3. **Constants**: Extract magic numbers/strings to `constants.ts`
4. **Validation**: Validate user input using `validators.ts`
5. **Performance**: Avoid blocking operations; debounce frequent operations
6. **Memory**: Clean up timers, subscriptions, and listeners in cleanup methods

### Code Example

```typescript
import * as vscode from 'vscode';
import { Logger } from './utils/logger';
import { CONSTANTS } from './utils/constants';
import { validateTaskTitle } from './utils/validators';

export class TaskManager {
  private _outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this._outputChannel = outputChannel;
  }

  public async addTask(title: string): Promise<boolean> {
    const validation = validateTaskTitle(title);
    if (!validation.isValid) {
      Logger.error(this._outputChannel, 'Invalid task title', validation.errors);
      vscode.window.showErrorMessage(validation.errors.join(', '));
      return false;
    }

    try {
      // Task creation logic
      Logger.info(this._outputChannel, `Task created: ${title}`);
      return true;
    } catch (error) {
      Logger.error(this._outputChannel, 'Failed to create task', error);
      vscode.window.showErrorMessage('Failed to create task. Please try again.');
      return false;
    }
  }
}
```

## Questions?

If you have questions or need help:

1. Check existing issues for similar questions
2. Open a new issue with the "question" label
3. Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

Thank you for contributing to Jpdz Todo! 🎉

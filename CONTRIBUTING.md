# Contributing to FileHost Server

Thank you for your interest in contributing to FileHost Server! This document provides guidelines and information to help you get started with contributing to this open-source project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Code Style and Linting](#code-style-and-linting)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [License](#license)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please read and adhere to the [Code of Conduct](docs/CODE_OF_CONDUCT.md) before participating.

## Getting Started

For installation and setup instructions, please refer to the [official documentation](https://docs.egglord.dev/docs/filehost-setup/installation).

## Code Style and Linting

This project uses ESLint for code linting and TypeScript for type checking.

- **ESLint**: Configured in `eslint.config.js` in both service directories
- **TypeScript**: Configured in `tsconfig.json`

Run linting:

```bash
# Storage Service
cd storage-service
npx eslint src/

# Website
cd website
npx eslint src/
```

Please fix any linting errors before submitting your changes.

## Submitting Changes

1. **Fork the repository** on GitHub
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the code style guidelines
4. **Test your changes** thoroughly
5. **Commit your changes** with descriptive commit messages:
   ```bash
   git commit -m "Add feature: description of changes"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** on GitHub with a clear description of your changes

### Pull Request Guidelines

- Provide a clear, descriptive title
- Describe the problem you're solving and your approach
- Reference any related issues
- Ensure all tests pass and linting is clean
- Update documentation if necessary

## Reporting Issues

If you find a bug or have a feature request:

1. Check existing [issues](https://github.com/Spiderjockey02/filehost-server/issues) to avoid duplicates
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs. actual behavior
   - Environment details (OS, Node.js version, etc.)
   - Screenshots if applicable

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project. See [LICENSE](docs/LICENSE) for details.

---

We appreciate your contributions to making FileHost Server better! 🎉
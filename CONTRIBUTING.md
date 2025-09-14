# Contributing to Travel&Joy

Thank you for your interest in contributing to Travel&Joy! We welcome contributions from developers of all skill levels.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Git

### Setting Up Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/Route-.git
   cd Route-
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Configure your .env file
   npm run db:migrate
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   npm start
   ```

## 📝 Development Guidelines

### Code Style
- We use ESLint and Prettier for code formatting
- Run `npm run lint` and `npm run format` before committing
- Follow the existing code style and patterns

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

feat(auth): add password reset functionality
fix(api): resolve trip deletion bug
docs(readme): update installation instructions
test(e2e): add trip creation tests
```

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-readme` - Documentation updates
- `test/add-unit-tests` - Test additions

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Backend tests
   cd server && npm test
   
   # Frontend tests
   cd client && npm test
   
   # Lint checks
   npm run lint
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat(trips): add trip sharing functionality"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all CI checks pass

## 🏗️ Project Architecture

### Backend Structure
```
server/
├── controllers/     # Request handlers
├── routes/         # API routes
├── middleware/     # Custom middleware
├── models/         # Database models
├── config/         # Configuration
├── scripts/        # Database scripts
└── utils/          # Utility functions
```

### Frontend Structure
```
client/src/
├── components/     # Reusable components
├── pages/         # Page components
├── contexts/      # React contexts
├── services/      # API services
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## 🧪 Testing Guidelines

### Backend Testing
- Unit tests for controllers and utilities
- Integration tests for API endpoints
- Use Jest and Supertest

### Frontend Testing
- Component tests with React Testing Library
- Integration tests for user flows
- Use Jest and React Testing Library

### E2E Testing
- Critical user journeys
- Cross-browser compatibility
- Use Playwright

## 📋 Issue Guidelines

### Bug Reports
Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests
Include:
- Clear description of the feature
- Use cases and benefits
- Implementation considerations

## 🔍 Code Review Process

### What We Look For
- **Functionality**: Does the code work as intended?
- **Code Quality**: Is it clean, readable, and maintainable?
- **Testing**: Are there adequate tests?
- **Documentation**: Is it properly documented?
- **Performance**: Are there any performance concerns?

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests pass and provide good coverage
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Security considerations addressed

## 🌟 Ways to Contribute

### Code Contributions
- Bug fixes
- New features
- Performance improvements
- Refactoring

### Non-Code Contributions
- Documentation improvements
- Bug reports
- Feature suggestions
- Design improvements
- Testing

## 🚫 What We Don't Accept

- Contributions that break existing functionality
- Code without proper tests
- Features that significantly increase complexity without clear benefit
- Contributions that don't follow our code style

## ❓ Getting Help

- **Discord**: Join our development community
- **GitHub Issues**: For bugs and feature requests
- **Email**: dev@traveljoy.com for questions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Special mentions in project announcements

Thank you for contributing to Travel&Joy! 🌍✈️
# Contributing

Thank you for your interest in contributing to Inkwell!

## Development Setup

1. Fork and clone the repository
2. Follow setup instructions in README.md
3. Create a feature branch: `git checkout -b feature/your-feature`

## Code Style

### Backend (Python)
- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Keep formatting consistent with existing code

### Frontend (TypeScript)
- Follow existing ESLint configuration
- Use TypeScript types (avoid `any`)
- Run `npm run lint` before committing

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Write clear commit messages
4. Request review from maintainers

## Reporting Issues

Use GitHub Issues for:
- Bug reports (include steps to reproduce)
- Feature requests
- Documentation improvements

For security issues, see [SECURITY.md](SECURITY.md).

## Development Tips

### Running the Backend
```bash
cd blog-editor-api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Running the Frontend
```bash
cd blog-editor-web
npm install
npm run dev
```

### Testing API Endpoints
Visit http://localhost:8000/docs for interactive API documentation.

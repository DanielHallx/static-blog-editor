# Static Blog Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

[demo-image](./demo_image.png)  

A visual blog editor for static blogs with GitHub integration. Works with Astro, Hugo, Jekyll, Eleventy, Gatsby, and any static site generator that uses Markdown files. Manage your blog content through an elegant web interface with Markdown editing, image uploads, and real-time preview.

## Features

- **GitHub Integration**: Direct management of blog content via GitHub API
- **Visual Editor**: Markdown editor with live preview
- **Image Upload**: Drag & drop image uploads with automatic optimization
- **Frontmatter Management**: Visual form for post metadata (title, description, date, tags)
- **Draft Support**: Save posts as drafts before publishing
- **Local Draft Recovery**: Automatically saves drafts locally and recovers unsaved work
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

The project consists of two parts:

### Backend (FastAPI)

- Python FastAPI server
- GitHub OAuth authentication
- PyGithub for repository management
- Image processing with Pillow

### Frontend (Next.js)

- Next.js 14 with App Router
- shadcn/ui components
- Tailwind CSS styling
- React Query for data fetching
- Zustand for state management

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- GitHub OAuth App credentials

### Backend Setup

```bash
cd blog-editor-api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd blog-editor-web
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the editor.

## Configuration

### GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App with:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:8000/api/auth/callback`
3. Copy Client ID and Client Secret to backend `.env`

### Environment Variables

See individual README files in `blog-editor-api/` and `blog-editor-web/` for detailed configuration.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/login | Start GitHub OAuth flow |
| GET | /api/auth/callback | OAuth callback handler |
| GET | /api/auth/me | Get current user |
| GET | /api/posts | List all posts |
| GET | /api/posts/{slug} | Get single post |
| POST | /api/posts | Create new post |
| PUT | /api/posts/{slug} | Update post |
| DELETE | /api/posts/{slug} | Delete post |
| POST | /api/images/upload/{slug} | Upload image |

## Deployment

### Frontend (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DanielHallx/static-blog-editor&project-name=static-blog-editor-web&root-directory=blog-editor-web&env=NEXT_PUBLIC_API_URL&envDescription=Backend%20API%20URL)

1. Click the button above to deploy
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Deploy

### Backend (Railway)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/DanielHallx/static-blog-editor&rootDir=blog-editor-api)

1. Click the button above to deploy
2. Set environment variables (see `.env.example`)
3. Update GitHub OAuth callback URL to match your Railway domain

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Security

See [SECURITY.md](SECURITY.md) for our security policy and how to report vulnerabilities.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

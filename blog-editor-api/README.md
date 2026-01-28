# Blog Editor API

FastAPI backend for the Astro Blog Editor, providing GitHub integration for managing blog content.

## Features

- GitHub OAuth authentication
- Blog post CRUD operations via GitHub API
- Image upload with automatic optimization
- Markdown frontmatter parsing and generation

## Setup

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required settings:
- `GITHUB_CLIENT_ID` - OAuth App Client ID
- `GITHUB_CLIENT_SECRET` - OAuth App Client Secret
- `GITHUB_REPO_OWNER` - Your GitHub username
- `GITHUB_REPO_NAME` - Your blog repository name

### 3. Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:8000/api/auth/callback`
4. Copy Client ID and Client Secret to `.env`

### 4. Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Authentication
- `GET /api/auth/login` - Initiate GitHub OAuth
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Posts
- `GET /api/posts` - List all posts
- `GET /api/posts/{slug}` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/{slug}` - Update post
- `DELETE /api/posts/{slug}` - Delete post

### Images
- `POST /api/images/upload/{slug}` - Upload image for post

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

# Blog Editor Web

Next.js frontend for the Astro Blog Editor with shadcn/ui components.

## Features

- Dashboard with post statistics
- Post list with draft filtering
- Visual Markdown editor with live preview
- Image upload with drag & drop support
- Dark mode support
- Responsive design

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

For local development, the API URL can be left empty as the Next.js proxy handles requests.

### 3. Run Development Server

Make sure the backend is running on port 8000, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── layout.tsx           # Root layout with providers
├── page.tsx             # Dashboard page
├── providers.tsx        # React Query provider
├── globals.css          # Global styles with Tailwind
├── posts/
│   ├── page.tsx         # Posts list
│   ├── new/page.tsx     # Create new post
│   └── [slug]/edit/page.tsx  # Edit existing post
components/
├── ui/                  # shadcn/ui components
├── editor/              # Editor components
│   ├── MarkdownEditor.tsx   # Main editor with tabs
│   ├── MarkdownPreview.tsx  # Markdown preview
│   ├── ImageUploader.tsx    # Image upload
│   └── CalloutBlock.tsx     # Custom callout component
└── posts/
    ├── FrontmatterForm.tsx  # Post metadata form
    ├── TagInput.tsx         # Tag input component
    └── PostCard.tsx         # Post card for list
lib/
├── api.ts               # API client
├── store.ts             # Zustand auth store
└── utils.ts             # Utility functions
```

## Build for Production

```bash
npm run build
npm run start
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

### Other Platforms

Build the production version and deploy the `.next` folder or use the standalone output.

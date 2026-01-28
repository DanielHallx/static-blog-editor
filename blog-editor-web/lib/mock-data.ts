/**
 * Mock data for demo mode (DEMO_MODE=true)
 */

import { Post, PostListItem, User } from "./api";

export const mockUser: User = {
  login: "demo-user",
  name: "Demo User",
  avatar_url: "https://avatars.githubusercontent.com/u/0?v=4",
  email: "demo@example.com",
};

export const mockPosts: Post[] = [
  {
    slug: "getting-started-with-astro",
    title: "Getting Started with Astro",
    description:
      "Learn how to build fast, content-focused websites with Astro framework.",
    date: "2024-01-15",
    draft: false,
    tags: ["astro", "web development", "tutorial"],
    content: `# Getting Started with Astro

Astro is a modern static site generator that delivers lightning-fast performance by shipping zero JavaScript by default.

## Why Astro?

- **Fast by default**: Astro websites are incredibly fast because they ship zero JavaScript.
- **Content-focused**: Perfect for blogs, documentation, and marketing sites.
- **Island Architecture**: Use your favorite UI framework only where you need it.

## Installation

\`\`\`bash
npm create astro@latest
\`\`\`

## Your First Page

Create a new file at \`src/pages/index.astro\`:

\`\`\`astro
---
const title = "Hello, Astro!";
---

<html>
  <head>
    <title>{title}</title>
  </head>
  <body>
    <h1>{title}</h1>
    <p>Welcome to my Astro site!</p>
  </body>
</html>
\`\`\`

That's it! You've created your first Astro page.
`,
    file_path: "src/content/posts/getting-started-with-astro/index.md",
  },
  {
    slug: "markdown-guide",
    title: "Markdown Writing Guide",
    description:
      "A comprehensive guide to writing beautiful content with Markdown syntax.",
    date: "2024-01-10",
    draft: false,
    tags: ["markdown", "writing", "guide"],
    content: `# Markdown Writing Guide

Markdown is a lightweight markup language that makes writing for the web easy and enjoyable.

## Basic Syntax

### Headers

Use \`#\` for headers:

\`\`\`markdown
# H1
## H2
### H3
\`\`\`

### Emphasis

- *Italic* with \`*asterisks*\`
- **Bold** with \`**double asterisks**\`
- ~~Strikethrough~~ with \`~~tildes~~\`

### Lists

Unordered:
- Item 1
- Item 2
  - Nested item

Ordered:
1. First item
2. Second item

### Code

Inline \`code\` with backticks.

Code blocks with triple backticks:

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### Links and Images

- [Link text](https://example.com)
- ![Alt text](image.jpg)

### Blockquotes

> This is a blockquote.
> It can span multiple lines.

Happy writing!
`,
    file_path: "src/content/posts/markdown-guide/index.md",
  },
  {
    slug: "draft-post-example",
    title: "My Draft Post",
    description: "This is a draft post that is not yet published.",
    date: "2024-01-20",
    draft: true,
    tags: ["draft"],
    content: `# My Draft Post

This post is still a work in progress.

## Ideas to cover

- [ ] Topic 1
- [ ] Topic 2
- [ ] Topic 3

More content coming soon...
`,
    file_path: "src/content/posts/draft-post-example/index.md",
  },
];

// In-memory store for demo (allows CRUD operations during session)
const postsStore = [...mockPosts];

export function getMockPosts(): Post[] {
  return postsStore;
}

export function getMockPostList(includeDrafts: boolean): PostListItem[] {
  return postsStore
    .filter((post) => includeDrafts || !post.draft)
    .map(({ slug, title, description, date, draft, tags }) => ({
      slug,
      title,
      description,
      date,
      draft,
      tags,
    }));
}

export function getMockPost(slug: string): Post | undefined {
  return postsStore.find((post) => post.slug === slug);
}

export function createMockPost(data: Omit<Post, "file_path">): Post {
  const newPost: Post = {
    ...data,
    file_path: `src/content/posts/${data.slug}/index.md`,
  };
  postsStore.unshift(newPost);
  return newPost;
}

export function updateMockPost(
  slug: string,
  data: Partial<Post>
): Post | undefined {
  const index = postsStore.findIndex((post) => post.slug === slug);
  if (index === -1) return undefined;

  postsStore[index] = { ...postsStore[index], ...data };
  return postsStore[index];
}

export function deleteMockPost(slug: string): boolean {
  const index = postsStore.findIndex((post) => post.slug === slug);
  if (index === -1) return false;

  postsStore.splice(index, 1);
  return true;
}

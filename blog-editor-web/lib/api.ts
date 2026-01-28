/**
 * API client for communicating with the backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch((parseError) => {
      console.error("Failed to parse error response:", parseError);
      return { detail: "Unknown error" };
    });
    throw new ApiError(response.status, error.detail || "Request failed");
  }

  // Handle 204 No Content - should not be used with fetchApi<T>
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Fetch API for void responses (DELETE, etc.)
 */
async function fetchApiVoid(
  endpoint: string,
  options: FetchOptions = {},
): Promise<void> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch((parseError) => {
      console.error("Failed to parse error response:", parseError);
      return { detail: "Unknown error" };
    });
    throw new ApiError(response.status, error.detail || "Request failed");
  }
}

// Post types
export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  draft: boolean;
  tags: string[];
  content: string;
  file_path: string;
}

export interface PostListItem {
  slug: string;
  title: string;
  description: string;
  date: string;
  draft: boolean;
  tags: string[];
}

export interface PostList {
  posts: PostListItem[];
  total: number;
}

export interface CreatePostData {
  slug: string;
  title: string;
  description: string;
  date: string;
  draft: boolean;
  tags: string[];
  content: string;
}

export interface UpdatePostData {
  title?: string;
  description?: string;
  date?: string;
  draft?: boolean;
  tags?: string[];
  content?: string;
}

export interface User {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface ImageUploadResponse {
  success: boolean;
  filename: string;
  path: string;
  relative_path: string;
  markdown: string;
}

// API methods
export const api = {
  // Auth
  getCurrentUser: () => fetchApi<User>("/api/auth/me"),

  // Posts
  listPosts: (includeDrafts = true) =>
    fetchApi<PostList>("/api/posts", {
      params: { include_drafts: String(includeDrafts) },
    }),

  getPost: (slug: string) => fetchApi<Post>(`/api/posts/${slug}`),

  createPost: (data: CreatePostData) =>
    fetchApi<Post>("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePost: (slug: string, data: UpdatePostData) =>
    fetchApi<Post>(`/api/posts/${slug}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deletePost: (slug: string) =>
    fetchApiVoid(`/api/posts/${slug}`, {
      method: "DELETE",
    }),

  // Images
  uploadImage: async (slug: string, file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/images/upload/${slug}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch((parseError) => {
        console.error("Failed to parse upload error response:", parseError);
        return { detail: "Upload failed" };
      });
      throw new ApiError(response.status, error.detail);
    }

    return response.json();
  },
};

export { ApiError };

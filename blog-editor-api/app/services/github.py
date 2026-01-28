"""GitHub API service for managing blog content."""

import base64
from datetime import date, datetime
from typing import Any

from github import Github
from github.ContentFile import ContentFile
from github.GithubException import GithubException, UnknownObjectException
from github.Repository import Repository

from app.config import get_settings
from app.schemas.post import PostCreate, PostListItem, PostResponse, PostUpdate
from app.services.markdown import create_post_content, parse_frontmatter


class GitHubService:
    """Service for interacting with GitHub API."""

    def __init__(self, access_token: str):
        """Initialize GitHub service with access token.

        Args:
            access_token: GitHub OAuth access token.
        """
        self.github = Github(access_token)
        self.settings = get_settings()

    def _get_repo(self) -> Repository:
        """Get the configured GitHub repository.

        Returns:
            Repository object.
        """
        return self.github.get_repo(
            f"{self.settings.github_repo_owner}/{self.settings.github_repo_name}"
        )

    def _get_post_path(self, slug: str, extension: str = "md") -> str:
        """Get the file path for a post.

        Args:
            slug: Post slug.
            extension: File extension (md or mdx).

        Returns:
            Full file path in repository.
        """
        return f"{self.settings.blog_content_path}/{slug}/index.{extension}"

    def _get_images_path(self, slug: str) -> str:
        """Get the images directory path for a post.

        Args:
            slug: Post slug.

        Returns:
            Images directory path.
        """
        return f"{self.settings.blog_content_path}/{slug}/images"

    def _parse_post_content(
        self, content_file: ContentFile, slug: str
    ) -> PostResponse | None:
        """Parse a ContentFile into a PostResponse.

        Args:
            content_file: GitHub ContentFile object.
            slug: Post slug.

        Returns:
            PostResponse or None if parsing fails.
        """
        content = base64.b64decode(content_file.content).decode("utf-8")
        return self._parse_post_text(content, slug, content_file.path)

    def _parse_post_text(self, content: str, slug: str, file_path: str) -> PostResponse | None:
        """Parse markdown content into a PostResponse.

        Args:
            content: Raw markdown content.
            slug: Post slug.
            file_path: File path in repository.

        Returns:
            PostResponse or None if parsing fails.
        """
        frontmatter, body = parse_frontmatter(content)

        if not frontmatter.get("title") or not frontmatter.get("description"):
            return None

        # Parse date
        date_str = frontmatter.get("date", "")
        if isinstance(date_str, str):
            try:
                post_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                post_date = date.today()
        elif isinstance(date_str, date):
            post_date = date_str
        else:
            post_date = date.today()

        return PostResponse(
            slug=slug,
            title=frontmatter.get("title", ""),
            description=frontmatter.get("description", ""),
            date=post_date,
            draft=frontmatter.get("draft", False),
            tags=frontmatter.get("tags", []),
            content=body,
            file_path=file_path,
        )

    def list_posts(self, include_drafts: bool = True) -> list[PostListItem]:
        """List all blog posts.

        Args:
            include_drafts: Whether to include draft posts.

        Returns:
            List of PostListItem objects.
        """
        repo = self._get_repo()
        posts: list[PostListItem] = []

        try:
            tree = repo.get_git_tree(self.settings.github_branch, recursive=True)
        except GithubException:
            return posts

        prefix = f"{self.settings.blog_content_path}/"
        index_files: dict[str, tuple[str, str, int]] = {}

        for item in tree.tree:
            if item.type != "blob" or not item.path.startswith(prefix):
                continue

            if not (item.path.endswith("/index.md") or item.path.endswith("/index.mdx")):
                continue

            relative = item.path[len(prefix) :]
            slug = relative.split("/")[0]
            ext_priority = 1 if item.path.endswith(".mdx") else 0

            existing = index_files.get(slug)
            if not existing or ext_priority > existing[2]:
                index_files[slug] = (item.path, item.sha, ext_priority)

        for slug, (path, sha, _) in index_files.items():
            try:
                blob = repo.get_git_blob(sha)
                if blob.encoding == "base64":
                    content = base64.b64decode(blob.content).decode("utf-8")
                else:
                    content = blob.content
                post = self._parse_post_text(content, slug, path)
                if post and (include_drafts or not post.draft):
                    posts.append(
                        PostListItem(
                            slug=post.slug,
                            title=post.title,
                            description=post.description,
                            date=post.date,
                            draft=post.draft,
                            tags=post.tags,
                        )
                    )
            except GithubException:
                continue

        # Sort by date descending
        posts.sort(key=lambda p: p.date, reverse=True)
        return posts

    def get_post(self, slug: str) -> PostResponse | None:
        """Get a single post by slug.

        Args:
            slug: Post slug.

        Returns:
            PostResponse or None if not found.
        """
        repo = self._get_repo()

        for ext in ["md", "mdx"]:
            try:
                post_path = self._get_post_path(slug, ext)
                content_file = repo.get_contents(
                    post_path, ref=self.settings.github_branch
                )

                if isinstance(content_file, list):
                    continue

                return self._parse_post_content(content_file, slug)
            except UnknownObjectException:
                continue

        return None

    def create_post(self, post: PostCreate) -> PostResponse:
        """Create a new post.

        Args:
            post: PostCreate schema.

        Returns:
            Created PostResponse.

        Raises:
            GithubException: If creation fails.
        """
        repo = self._get_repo()
        post_path = self._get_post_path(post.slug)

        # Check if post already exists
        try:
            repo.get_contents(post_path, ref=self.settings.github_branch)
            raise ValueError(f"Post with slug '{post.slug}' already exists")
        except UnknownObjectException:
            pass

        content = create_post_content(
            title=post.title,
            description=post.description,
            post_date=post.date,
            body=post.content,
            draft=post.draft,
            tags=post.tags,
        )

        repo.create_file(
            path=post_path,
            message=f"Create post: {post.title}",
            content=content,
            branch=self.settings.github_branch,
        )

        return PostResponse(
            slug=post.slug,
            title=post.title,
            description=post.description,
            date=post.date,
            draft=post.draft,
            tags=post.tags,
            content=post.content,
            file_path=post_path,
        )

    def update_post(self, slug: str, post_update: PostUpdate) -> PostResponse | None:
        """Update an existing post.

        Args:
            slug: Post slug.
            post_update: PostUpdate schema with fields to update.

        Returns:
            Updated PostResponse or None if not found.
        """
        repo = self._get_repo()
        existing_post = self.get_post(slug)

        if not existing_post:
            return None

        # Merge updates
        title = (
            post_update.title if post_update.title is not None else existing_post.title
        )
        description = (
            post_update.description
            if post_update.description is not None
            else existing_post.description
        )
        post_date = (
            post_update.date if post_update.date is not None else existing_post.date
        )
        draft = (
            post_update.draft if post_update.draft is not None else existing_post.draft
        )
        tags = (
            post_update.tags if post_update.tags is not None else existing_post.tags
        )
        content_body = (
            post_update.content
            if post_update.content is not None
            else existing_post.content
        )

        new_content = create_post_content(
            title=title,
            description=description,
            post_date=post_date,
            body=content_body,
            draft=draft,
            tags=tags,
        )

        # Get the file to update
        content_file = repo.get_contents(
            existing_post.file_path, ref=self.settings.github_branch
        )

        if isinstance(content_file, list):
            return None

        repo.update_file(
            path=existing_post.file_path,
            message=f"Update post: {title}",
            content=new_content,
            sha=content_file.sha,
            branch=self.settings.github_branch,
        )

        return PostResponse(
            slug=slug,
            title=title,
            description=description,
            date=post_date,
            draft=draft,
            tags=tags,
            content=content_body,
            file_path=existing_post.file_path,
        )

    def delete_post(self, slug: str) -> bool:
        """Delete a post and its associated images.

        Args:
            slug: Post slug.

        Returns:
            True if deleted, False if not found.
        """
        repo = self._get_repo()
        existing_post = self.get_post(slug)

        if not existing_post:
            return False

        # Delete the main file
        content_file = repo.get_contents(
            existing_post.file_path, ref=self.settings.github_branch
        )

        if isinstance(content_file, list):
            return False

        repo.delete_file(
            path=existing_post.file_path,
            message=f"Delete post: {existing_post.title}",
            sha=content_file.sha,
            branch=self.settings.github_branch,
        )

        # Try to delete images directory
        try:
            images_path = self._get_images_path(slug)
            images_contents = repo.get_contents(
                images_path, ref=self.settings.github_branch
            )

            if isinstance(images_contents, list):
                for image_file in images_contents:
                    repo.delete_file(
                        path=image_file.path,
                        message=f"Delete image: {image_file.name}",
                        sha=image_file.sha,
                        branch=self.settings.github_branch,
                    )
        except UnknownObjectException:
            pass

        return True

    def upload_image(
        self, slug: str, filename: str, content: bytes
    ) -> dict[str, Any]:
        """Upload an image to the post's images directory.

        Args:
            slug: Post slug.
            filename: Image filename.
            content: Image binary content.

        Returns:
            Dict with image path and URL.
        """
        repo = self._get_repo()
        image_path = f"{self._get_images_path(slug)}/{filename}"

        # Check if image already exists
        try:
            existing = repo.get_contents(image_path, ref=self.settings.github_branch)
            if not isinstance(existing, list):
                repo.update_file(
                    path=image_path,
                    message=f"Update image: {filename}",
                    content=content,
                    sha=existing.sha,
                    branch=self.settings.github_branch,
                )
        except UnknownObjectException:
            repo.create_file(
                path=image_path,
                message=f"Add image: {filename}",
                content=content,
                branch=self.settings.github_branch,
            )

        # Return relative path for markdown
        relative_path = f"./images/{filename}"

        return {
            "path": image_path,
            "relative_path": relative_path,
            "markdown": f"![{filename}]({relative_path})",
        }

    def get_user(self) -> dict[str, Any]:
        """Get authenticated user info.

        Returns:
            Dict with user info.
        """
        user = self.github.get_user()
        return {
            "login": user.login,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "email": user.email,
        }

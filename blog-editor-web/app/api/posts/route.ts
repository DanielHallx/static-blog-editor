import { NextRequest, NextResponse } from "next/server";
import { getMockPostList, createMockPost } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const includeDrafts = searchParams.get("include_drafts") !== "false";

  const posts = getMockPostList(includeDrafts);

  return NextResponse.json({
    posts,
    total: posts.length,
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  const newPost = createMockPost({
    slug: data.slug,
    title: data.title,
    description: data.description,
    date: data.date,
    draft: data.draft ?? true,
    tags: data.tags ?? [],
    content: data.content ?? "",
  });

  return NextResponse.json(newPost, { status: 201 });
}

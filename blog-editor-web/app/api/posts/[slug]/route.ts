import { NextRequest, NextResponse } from "next/server";
import { getMockPost, updateMockPost, deleteMockPost } from "@/lib/mock-data";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const post = getMockPost(slug);

  if (!post) {
    return NextResponse.json({ detail: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const data = await request.json();

  const updatedPost = updateMockPost(slug, data);

  if (!updatedPost) {
    return NextResponse.json({ detail: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(updatedPost);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const deleted = deleteMockPost(slug);

  if (!deleted) {
    return NextResponse.json({ detail: "Post not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

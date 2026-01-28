import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ detail: "No file provided" }, { status: 400 });
  }

  // In demo mode, we simulate upload by returning a placeholder
  const filename = file.name;
  const relativePath = `./${filename}`;

  return NextResponse.json({
    success: true,
    filename,
    path: `src/content/posts/${slug}/${filename}`,
    relative_path: relativePath,
    markdown: `![${filename}](${relativePath})`,
  });
}

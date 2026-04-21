// app/api/get-file/route.ts
import { NextResponse } from "next/server";
import { generatePresignedUrl } from "./../live-prices/route"; // import the helper

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const objectKey = searchParams.get("key") || "live_prices.json";

  try {
    // Generate presigned URL on the server (no relative fetch)
    const presignedUrl = await generatePresignedUrl(objectKey, 86400);

    // Fetch the actual file from S3
    const fileResponse = await fetch(presignedUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!fileResponse.ok) {
      throw new Error(`S3 returned ${fileResponse.status}`);
    }

    const data = await fileResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching file from S3:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}
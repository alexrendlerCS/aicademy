import { createDemoAccounts } from "@/lib/demo-setup";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await createDemoAccounts();

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to create demo accounts" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in demo setup route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

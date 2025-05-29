import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST() {
  try {
    console.log("Starting demo account cleanup...");

    // Get all users
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();

    if (getUserError) {
      console.error("Error listing users:", getUserError);
      return NextResponse.json(
        { error: "Failed to list users" },
        { status: 500 }
      );
    }

    // Filter demo users with timestamps in their emails
    const demoUsersToDelete = users.filter(
      (u) => u.email?.includes("demo.") && 
             u.email?.includes("+") && 
             u.email?.includes("@aicademy.edu")
    );

    console.log(`Found ${demoUsersToDelete.length} demo users to clean up`);

    // Delete each demo user
    for (const user of demoUsersToDelete) {
      try {
        console.log(`Deleting user: ${user.email}`);

        // Delete from auth.users
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
          user.id,
          true // hard delete
        );

        if (deleteAuthError) {
          console.error(`Error deleting auth user ${user.email}:`, deleteAuthError);
          continue;
        }

        // Delete from public.users
        const { error: deletePublicError } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("email", user.email);

        if (deletePublicError) {
          console.error(`Error deleting from public.users ${user.email}:`, deletePublicError);
        }
      } catch (error) {
        console.error(`Error deleting user ${user.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: demoUsersToDelete.length
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
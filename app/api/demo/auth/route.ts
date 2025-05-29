import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Enhanced environment and auth validation logging
console.log("Supabase Configuration:", {
  url: supabaseUrl?.substring(0, 12),
  serviceKey: {
    exists: !!supabaseServiceKey,
    length: supabaseServiceKey?.length,
    prefix: supabaseServiceKey?.substring(0, 6),
    isServiceKey:
      supabaseServiceKey?.startsWith("eyJ") && supabaseServiceKey?.length > 100,
  },
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  throw new Error("Missing required environment variables");
}

// Validate service key format
if (!supabaseServiceKey.startsWith("eyJ") || supabaseServiceKey.length < 100) {
  console.error(
    "Invalid service key format - ensure you're using the service_role key, not the anon key"
  );
  throw new Error("Invalid service key format");
}

// Create a Supabase admin client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test the admin client connection and permissions
async function testConnection() {
  try {
    // Test admin API access specifically
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Failed to connect to Supabase:", {
        error: error.message,
        status: error.status,
        statusText: error?.name,
      });
      return false;
    }

    console.log("Successfully connected to Supabase with admin privileges");
    return true;
  } catch (error: any) {
    console.error("Error testing Supabase connection:", {
      message: error.message,
      name: error.name,
      status: error?.status,
      response: error?.response,
    });
    return false;
  }
}

// Cleanup function that uses only admin API calls
async function cleanupDemoAccounts() {
  console.log("Starting demo account cleanup...");

  try {
    const {
      data: { users },
      error: getUserError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (getUserError) {
      console.error("Error listing users during cleanup:", getUserError);
      return;
    }

    const demoUsers = users.filter(
      (u) => u.email?.includes("demo.") && u.email?.includes("@aicademy.edu")
    );

    console.log(
      `Found ${demoUsers.length} demo users to clean up:`,
      demoUsers.map((u) => ({ id: u.id, email: u.email }))
    );

    // Delete each demo user
    for (const user of demoUsers) {
      console.log(`Deleting demo user: ${user.email}`);

      try {
        // Delete from auth system
        const { error: deleteError } =
          await supabaseAdmin.auth.admin.deleteUser(
            user.id,
            true // hard delete
          );

        if (deleteError) {
          console.error(`Error deleting auth user ${user.email}:`, deleteError);
          continue;
        }

        // Delete from public users table
        const { error: deletePublicError } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("email", user.email);

        if (deletePublicError) {
          console.error(
            `Error deleting from public.users ${user.email}:`,
            deletePublicError
          );
        }
      } catch (error) {
        console.error(`Unexpected error deleting user ${user.email}:`, error);
      }
    }

    console.log("Demo account cleanup completed");
  } catch (error) {
    console.error("Error during demo account cleanup:", error);
  }
}

export async function POST(request: Request) {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          error: "Failed to connect to database",
          details:
            "Could not establish connection to Supabase with admin privileges",
        },
        { status: 500 }
      );
    }

    const { role } = await request.json();
    console.log("Attempting demo login for role:", role);

    if (!role || !["student", "teacher"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Use static demo emails
    const email = role === "student" 
      ? "demo.student@aicademy.edu"
      : "demo.teacher@aicademy.edu";
    const fullName = role === "student" ? "Demo Student" : "Demo Teacher";
    const gradeLevel = role === "student" ? "11" : null;

    console.log("Using email:", email);

    // Try to sign in first
    try {
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password: "demo123",
      });

      if (!signInError && signInData?.session) {
        console.log("Successfully signed in existing demo user");
        return NextResponse.json({
          success: true,
          session: signInData.session,
        });
      }

      // If sign in failed, continue with user creation
      console.log("Sign in failed, attempting to create user");
    } catch (error: any) {
      console.log("Sign in attempt failed:", error.message);
      // Continue with user creation
    }

    // Check for existing user using admin API
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();

    if (getUserError) {
      console.error("Error listing users:", {
        error: getUserError,
        details: getUserError.message,
        status: getUserError?.status,
        name: getUserError?.name,
      });
      return NextResponse.json(
        {
          error: "Database error fetching users",
          details: getUserError.message,
        },
        { status: 500 }
      );
    }

    // Log all users for debugging
    console.log("All users:", users.map(u => ({ id: u.id, email: u.email })));

    // Find existing user with exact email match
    const existingUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    
    console.log("Looking for user with email:", email);
    console.log("Found existing user:", existingUser ? {
      id: existingUser.id,
      email: existingUser.email,
      metadata: existingUser.user_metadata
    } : "null");

    let userId: string;

    if (!existingUser) {
      // Create the static demo user if it doesn't exist using the update_demo_user function
      const { data: updateData, error: updateError } = await supabaseAdmin.rpc(
        'update_demo_user',
        {
          p_email: email,
          p_password: 'demo123',
          p_role: role,
          p_full_name: fullName,
          p_grade_level: gradeLevel
        }
      );

      if (updateError) {
        console.error("Error updating/creating demo user:", {
          message: updateError.message,
          code: updateError?.code,
          hint: updateError?.hint,
          details: updateError?.details
        });
        return NextResponse.json(
          {
            error: "Failed to create demo user",
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      // Get the user ID after creation
      const { data: { users: updatedUsers }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
      if (getUserError) {
        console.error("Error getting updated user list:", getUserError);
        return NextResponse.json(
          {
            error: "Failed to verify user creation",
            details: getUserError.message,
          },
          { status: 500 }
        );
      }

      const updatedUser = updatedUsers.find(u => u.email === email);
      if (!updatedUser) {
        console.error("Could not find created user");
        return NextResponse.json(
          {
            error: "Failed to verify user creation",
            details: "User not found after creation",
          },
          { status: 500 }
        );
      }

      userId = updatedUser.id;
    } else {
      userId = existingUser.id;
    }

    // Create a new session using signInWithPassword
    console.log("Creating session for user ID:", userId);
    try {
      const { data: sessionData, error: sessionError } =
        await supabaseAdmin.auth.signInWithPassword({
          email,
          password: "demo123",
        });

      if (sessionError) {
        console.error("Error creating session:", {
          message: sessionError.message,
          code: sessionError?.status,
          name: sessionError?.name,
          response: (sessionError as any)?.response,
        });
        return NextResponse.json(
          {
            error: "Failed to create session",
            details: sessionError.message,
          },
          { status: 500 }
        );
      }

      if (!sessionData?.session) {
        console.error("No session data returned");
        return NextResponse.json(
          {
            error: "Invalid session response",
          },
          { status: 500 }
        );
      }

      console.log("Session created successfully:", {
        user_id: sessionData.session.user.id,
        expires_at: sessionData.session.expires_at,
      });

      return NextResponse.json({
        success: true,
        session: sessionData.session,
      });
    } catch (error: any) {
      console.error("Session creation error:", {
        message: error.message,
        name: error.name,
        code: error.code,
        status: error?.status,
        response: error?.response,
        stack: error.stack,
      });
      return NextResponse.json(
        {
          error: "Failed to create session",
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Demo auth error:", {
      message: error.message,
      name: error.name,
      code: error.code,
      status: error?.status,
      response: error?.response,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

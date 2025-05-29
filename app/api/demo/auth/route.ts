import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Log environment variable status (without exposing actual values)
console.log("Environment variables status:", {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  urlPrefix: supabaseUrl?.substring(0, 8),
  keyPrefix: supabaseServiceKey?.substring(0, 4)
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  throw new Error("Missing required environment variables");
}

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test the admin client connection
async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error("Failed to connect to Supabase:", error);
      return false;
    }
    console.log("Successfully connected to Supabase");
    return true;
  } catch (error) {
    console.error("Error testing Supabase connection:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json({ 
        error: "Failed to connect to database",
        details: "Could not establish connection to Supabase" 
      }, { status: 500 });
    }

    const { role } = await request.json();
    console.log("Attempting demo login for role:", role);

    if (!role || !["student", "teacher"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const email = role === "student" ? "demo.student@aicademy.edu" : "demo.teacher@aicademy.edu";
    const fullName = role === "student" ? "Demo Student" : "Demo Teacher";
    const gradeLevel = role === "student" ? "11" : null;
    
    console.log("Using email:", email);

    // First, try to get the user from auth.users
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUserError) {
      console.error("Error getting users:", getUserError);
      return NextResponse.json({ 
        error: "Database error fetching users",
        details: getUserError.message 
      }, { status: 500 });
    }

    console.log("Current users in system:", users.map(u => ({ id: u.id, email: u.email })));

    const existingUser = users.find(u => u.email === email);
    let userId: string;

    if (!existingUser) {
      console.log("No existing user found, creating new user...");
      try {
        const createUserResponse = await supabaseAdmin.auth.admin.createUser({
          email,
          password: "demo123",
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role,
            grade_level: gradeLevel,
          },
        });

        console.log("Create user response:", {
          success: !!createUserResponse.data,
          error: createUserResponse.error,
          userId: createUserResponse.data?.user?.id
        });

        if (createUserResponse.error) {
          console.error("Detailed create user error:", {
            message: createUserResponse.error.message,
            status: createUserResponse.error.status,
            details: createUserResponse.error
          });
          return NextResponse.json({ 
            error: "Database error creating auth user",
            details: createUserResponse.error.message 
          }, { status: 500 });
        }

        if (!createUserResponse.data?.user?.id) {
          console.error("No user ID returned from createUser");
          return NextResponse.json({ 
            error: "Invalid response from auth creation" 
          }, { status: 500 });
        }

        userId = createUserResponse.data.user.id;
        console.log("Successfully created auth user with ID:", userId);

        // Create corresponding entry in public.users
        const createPublicResponse = await supabaseAdmin
          .from("users")
          .insert({
            id: userId,
            email,
            full_name: fullName,
            role,
            grade_level: gradeLevel,
          });

        if (createPublicResponse.error) {
          console.error("Error creating public user:", {
            message: createPublicResponse.error.message,
            details: createPublicResponse.error
          });
          // Clean up the auth user
          await supabaseAdmin.auth.admin.deleteUser(userId);
          return NextResponse.json({ 
            error: "Database error creating public user",
            details: createPublicResponse.error.message 
          }, { status: 500 });
        }
      } catch (error: any) {
        console.error("Unexpected error during user creation:", {
          message: error.message,
          stack: error.stack,
          details: error
        });
        return NextResponse.json({ 
          error: "Unexpected error during user creation",
          details: error.message 
        }, { status: 500 });
      }
    } else {
      userId = existingUser.id;
      console.log("Found existing user with ID:", userId);
      
      // Update existing user
      const updateResponse = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          password: "demo123",
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role,
            grade_level: gradeLevel,
          },
        }
      );

      if (updateResponse.error) {
        console.error("Error updating user:", updateResponse.error);
        return NextResponse.json({ 
          error: "Database error updating user",
          details: updateResponse.error.message 
        }, { status: 500 });
      }
    }

    // Create a new session
    console.log("Creating session for user ID:", userId);
    
    // Generate a sign-in link instead of directly creating a session
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (signInError) {
      console.error("Error generating sign-in link:", {
        message: signInError.message,
        details: signInError
      });
      return NextResponse.json({ 
        error: "Failed to generate sign-in",
        details: signInError.message 
      }, { status: 500 });
    }

    // Use the sign-in link to create a session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: email,
      password: "demo123",
    });

    if (sessionError) {
      console.error("Error signing in:", {
        message: sessionError.message,
        details: sessionError
      });
      return NextResponse.json({ 
        error: "Failed to sign in",
        details: sessionError.message 
      }, { status: 500 });
    }

    // Return the session data
    return NextResponse.json({
      session: sessionData.session,
      user: {
        id: userId,
        email,
        role,
      },
    });
  } catch (error: any) {
    console.error("Demo auth error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error 
    }, { status: 500 });
  }
}

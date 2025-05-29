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
    
    // Sign in with the demo account credentials
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password: "demo123",
    });

    if (signInError) {
      console.error("Error signing in:", signInError);
      return NextResponse.json({ 
        error: "Failed to sign in",
        details: signInError.message 
      }, { status: 500 });
    }

    if (!signInData.session) {
      console.error("No session returned from sign in");
      return NextResponse.json({ 
        error: "No session returned" 
      }, { status: 500 });
    }

    console.log("Session created successfully");
    return NextResponse.json({
      success: true,
      session: signInData.session,
    });
  } catch (error: any) {
    console.error("Demo auth error:", {
      message: error.message,
      stack: error.stack,
      details: error
    });
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

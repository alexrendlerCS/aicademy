import { supabase } from "./supabase";

export async function loginAsDemo(role: "student" | "teacher") {
  try {
    // Call our API route to handle demo authentication
    const response = await fetch("/api/demo/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Demo auth API error:", {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.details || data.error || "Failed to authenticate");
    }

    if (!data.session) {
      console.error("No session in response:", data);
      throw new Error("No session returned from server");
    }

    // Set the session in the client
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (setSessionError) {
      console.error("Error setting session:", setSessionError);
      throw setSessionError;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Demo login error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to login as demo user" 
    };
  }
}

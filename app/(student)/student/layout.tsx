import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { AIAssistantButton } from "@/components/ai-assistant-button"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar userType="student" userName="Sam Taylor" />
      <SidebarInset>
        <div className="container py-6 max-w-7xl">{children}</div>
        <AIAssistantButton />
      </SidebarInset>
    </div>
  )
}

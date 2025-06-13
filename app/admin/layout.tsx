"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LanguageProvider } from "@/contexts/language-context"
import AdminDashboard from "@/components/admin-dashboard"
import { BarChart } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)

    // Check if user is trying to access login page
    if (pathname === "/admin/login") {
      setIsLoading(false)
      return
    }

    // Check authentication
    const checkAuth = () => {
      const authStatus = localStorage.getItem("admin_authenticated")
      const authTime = localStorage.getItem("admin_auth_time")

      if (authStatus === "true" && authTime) {
        // Check if authentication is still valid (24 hours)
        const authTimestamp = Number.parseInt(authTime)
        const currentTime = Date.now()
        const twentyFourHours = 24 * 60 * 60 * 1000

        if (currentTime - authTimestamp < twentyFourHours) {
          setIsAuthenticated(true)
        } else {
          // Authentication expired
          localStorage.removeItem("admin_authenticated")
          localStorage.removeItem("admin_auth_time")
          router.push("/admin/login")
        }
      } else {
        router.push("/admin/login")
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router, pathname])

  // Show loading screen while checking authentication
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-gray">Carregando...</p>
        </div>
      </div>
    )
  }

  // If on login page, render children directly
  if (pathname === "/admin/login") {
    return <LanguageProvider>{children}</LanguageProvider>
  }

  // If not authenticated and not on login page, don't render anything
  // (user will be redirected to login)
  if (!isAuthenticated) {
    return null
  }

  return (
    <LanguageProvider>
      <AdminDashboard>
        {children}
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Menu</h2>
          <nav className="space-y-2">
            <a
              href="/admin/reports"
              className="flex items-center p-2 text-sm font-medium text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <BarChart className="w-6 h-6 text-gray-500" />
              <span className="ml-3">Relatórios</span>
            </a>
          </nav>
        </div>
      </AdminDashboard>
    </LanguageProvider>
  )
}

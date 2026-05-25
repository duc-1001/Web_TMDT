"use client"

import React, { useEffect } from "react"
import { Footer } from "./footer"
import { Header } from "./header"
import { SidebarProvider } from "@/components/ui/sidebar"
import UserSidebar from "./sidebar"
import { trackVisit } from "@/services/analytics.service"

const detectSource = (): string => {
  const params = new URLSearchParams(window.location.search)

  const utmSource = params.get("utm_source")?.toLowerCase()
  const utmMedium = params.get("utm_medium")?.toLowerCase()

  const referrer = document.referrer.toLowerCase()

  // ưu tiên UTM source (chi tiết nhất)
  if (utmSource) {
    if (utmMedium === "cpc" || utmMedium === "ads" || utmMedium === "paid") return "ads"
    if (utmSource === "facebook") return "facebook"
    if (utmSource === "instagram") return "instagram"
    if (utmSource === "tiktok") return "tiktok"
    if (utmSource === "youtube") return "youtube"
    if (utmSource === "google") return "google"
    if (utmSource === "bing") return "bing"
    if (utmSource === "zalo") return "zalo"
    if (utmSource === "email" || utmMedium === "email") return "email"
    return utmSource // giữ nguyên bất kỳ utm_source nào khác
  }

  // không có UTM → đọc referrer
  if (!referrer) return "direct"

  if (referrer.includes(window.location.hostname)) return "direct"

  if (referrer.includes("facebook.com") || referrer.includes("fb.com")) return "facebook"
  if (referrer.includes("instagram.com")) return "instagram"
  if (referrer.includes("tiktok.com")) return "tiktok"
  if (referrer.includes("youtube.com") || referrer.includes("youtu.be")) return "youtube"
  if (referrer.includes("zalo.me")) return "zalo"
  if (referrer.includes("google.com") || referrer.includes("google.")) return "google"
  if (referrer.includes("bing.com")) return "bing"
  if (referrer.includes("shopee.vn") || referrer.includes("lazada.vn")) return "marketplace"

  return "other"
}

const UserLayout = ({ children }: { children: React.ReactNode }) => {

  useEffect(() => {
    try {
      if (sessionStorage.getItem("visit_tracked")) return

      const source = detectSource()

      const payload = {
        landingPage: window.location.pathname,
        source
      }

      console.log("[Analytics] Payload:", payload)

      trackVisit(payload)

      sessionStorage.setItem("visit_tracked", "true")

    } catch (err) {
      console.error("[Analytics] trackVisit error:", err)
    }
  }, [])

  return (
    <SidebarProvider className="w-full">
      <div className="md:hidden block">
        <UserSidebar />
      </div>

      <div className="w-full">
        <Header />

        <div className="p-4 bg-gray-100">
          {children}
        </div>

        <Footer />
      </div>
    </SidebarProvider>
  )
}

export default UserLayout
"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"

import { RootState } from "@/store/store"

const upsertIconLink = (rel: string, href: string) => {
  if (!href) return

  let link = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement("link")
    link.rel = rel
    document.head.appendChild(link)
  }

  link.href = href
}

export default function DynamicSiteHead() {
  const { generalInfo } = useSelector((state: RootState) => state.generalInfo)

  useEffect(() => {
    const title = generalInfo?.websiteName || generalInfo?.shortName || "Snack Việt"
    document.title = title

    const favicon = generalInfo?.favicon
    if (favicon) {
      upsertIconLink("icon", favicon)
      upsertIconLink("shortcut icon", favicon)
      upsertIconLink("apple-touch-icon", favicon)
    }
  }, [generalInfo])

  return null
}

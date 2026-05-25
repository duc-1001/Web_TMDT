"use client"

import Image from "next/image"
import { Upload } from "lucide-react"

export function ImageUpload({
  label,
  description,
  preview,
  onUpload,
  size = "md",
}: {
  label: string
  description?: string
  preview?: string | null
  onUpload: (file: File) => void
  size?: "sm" | "md" | "lg"
}) {
  const height =
    size === "sm" ? "h-16" : size === "lg" ? "h-40" : "h-28"

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <label className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition">
        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
        <span className="text-xs text-muted-foreground">
          Click để tải ảnh
        </span>
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) =>
            e.target.files && onUpload(e.target.files[0])
          }
        />
      </label>

      {preview && (
        <div
          className={`relative ${height} w-full rounded-md overflow-hidden border`}
        >
          <Image
            src={preview}
            alt={label}
            fill
            className="object-contain"
          />
        </div>
      )}
    </div>
  )
}

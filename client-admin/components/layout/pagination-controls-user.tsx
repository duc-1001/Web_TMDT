import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  setCurrentPage
}) => {

  const generatePages = () => {
    const pages: (number | "...")[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)

      if (currentPage > 3) pages.push("...")

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (currentPage < totalPages - 2) pages.push("...")

      pages.push(totalPages)
    }

    return pages
  }

  const pages = generatePages()

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-1 mt-6">

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={i} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={p}
            variant={currentPage === p ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setCurrentPage(p)}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === totalPages}
        onClick={() =>
          setCurrentPage((p) => Math.min(totalPages, p + 1))
        }
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

    </div>
  )
}

export default PaginationControls
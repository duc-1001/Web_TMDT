import { ReactNode } from "react"
import { Label } from "@/components/ui/label"

export function FormField({
    label,
    description,
    children,
    error,
    isRequired,
}: {
    label: string
    description?: string
    children: ReactNode
    error?: string
    isRequired?: boolean
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium">{label}{isRequired && <span className="text-red-600">*</span>}</Label>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {children}
            {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
        </div>
    )
}

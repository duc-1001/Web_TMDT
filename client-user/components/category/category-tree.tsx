import { Category } from "@/types/category"
import { ChevronDown, ChevronRight, Folder, FolderOpen, GripVertical, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Award } from "lucide-react"
import React, { useState } from "react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"

interface TreeItemProps {
    category: Category
    children: Category[]
    level: number
    expandedIds: Set<string>
    onToggleExpand: (id: string) => void
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
    onToggleStatus: (id: string) => void
    onMoveUp: (category: Category) => void
    onMoveDown: (category: Category) => void
    onDragStart: (e: React.DragEvent, category: Category) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent, targetCategory: Category, position: "before" | "after" | "inside") => void
    isFirst: boolean
    isLast: boolean
    allCategories: Category[]
}

function TreeItem({
    category,
    children,
    level,
    expandedIds,
    onToggleExpand,
    onEdit,
    onDelete,
    onToggleStatus,
    onMoveUp,
    onMoveDown,
    onDragStart,
    onDragOver,
    onDrop,
    isFirst,
    isLast,
    allCategories,
}: TreeItemProps) {
    const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null)
    const hasChildren = children.length > 0
    const isExpanded = expandedIds.has(category._id)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        const y = e.clientY - rect.top
        const height = rect.height

        if (y < height * 0.25) {
            setDropPosition("before")
        } else if (y > height * 0.75) {
            setDropPosition("after")
        } else {
            setDropPosition("inside")
        }
    }

    const handleDragLeave = () => {
        setDropPosition(null)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (dropPosition) {
           await onDrop(e, category, dropPosition)
        }
        setDropPosition(null)
    }

    const productCount = hasChildren ? children.reduce((sum, child) => sum + (child.productCount || 0), 0) : (category.productCount || 0)

    return (
        <div className="select-none">
            {/* Drop indicator before */}
            {dropPosition === "before" && (
                <div
                    className="h-1 bg-orange-500 rounded-full mx-2 -mt-0.5 mb-0.5"
                    style={{ marginLeft: `${level * 32 + 8}px` }}
                />
            )}

            <div
                draggable
                onDragStart={(e) => onDragStart(e, category)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing
          transition-all duration-200
          ${dropPosition === "inside" ? "bg-orange-500/20 ring-2 ring-orange-500" : "hover:bg-muted/50"}
          ${!category.isActive ? "opacity-60" : ""}
        `}
                style={{ paddingLeft: `${level * 32 + 12}px` }}
            >
                <div className="flex items-center gap-2">
                    {/* Drag handle */}
                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />

                    {/* Expand/Collapse button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleExpand(category._id)
                        }}
                        className={`p-1 rounded hover:bg-muted transition-colors flex-shrink-0 ${!hasChildren ? "invisible" : ""}`}
                    >
                        {
                            hasChildren && (isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            ))
                        }
                    </button>

                    {/* Folder icon */}
                    <div className="flex-shrink-0">
                        {hasChildren ? (
                            <FolderOpen className="h-5 w-5 text-orange-500" />
                        ) : (
                            <Folder className="h-5 w-5 text-orange-500" />
                        )
                        }
                    </div>

                    {/* Category info */}
                    <div className="flex items-center min-w-0">
                        <img src={category.image || "/placeholder.svg"} alt={category.name} className="h-8 w-8 rounded-md object-cover mr-2 flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{category.name}</span>
                                {hasChildren && (
                                    <Badge variant="outline" className="text-xs">
                                        {children.length} con
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                    {productCount} SP
                                </Badge>
                                {!category.isActive && (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                        Đang ẩn
                                    </Badge>
                                )}
                            </div>
                            {category.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-md">{category.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation()
                            onMoveUp(category)
                        }}
                        disabled={isFirst}
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation()
                            onMoveDown(category)
                        }}
                        disabled={isLast}
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(category)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleStatus(category._id)}>
                                {category.isActive ? (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        Ẩn danh mục
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Hiển thị danh mục
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(category)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa danh mục
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Drop indicator after */}
            {dropPosition === "after" && !hasChildren && (
                <div className="h-1 bg-orange-500 rounded-full mx-2 mt-0.5" style={{ marginLeft: `${level * 32 + 8}px` }} />
            )}

            {/* Children */}
            {isExpanded && hasChildren && (
                <div className="relative">
                    {/* Tree line */}
                    <div className="absolute top-0 bottom-4 w-px " style={{ left: `${level * 32 + 28}px` }} />
                    {children.map((child, index) => {
                        const childChildren = allCategories.filter((c) => c.parent === child._id)
                        return (
                            <TreeItem
                                key={child._id}
                                category={child}
                                children={childChildren}
                                level={level + 1}
                                expandedIds={expandedIds}
                                onToggleExpand={onToggleExpand}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggleStatus={onToggleStatus}
                                onMoveUp={onMoveUp}
                                onMoveDown={onMoveDown}
                                onDragStart={onDragStart}
                                onDragOver={onDragOver}
                                onDrop={onDrop}
                                isFirst={index === 0}
                                isLast={index === children.length - 1}
                                allCategories={allCategories}
                            />
                        )
                    })}
                </div>
            )}

            {/* Drop indicator after with children */}
            {dropPosition === "after" && hasChildren && (
                <div className="h-1 bg-orange-500 rounded-full mx-2 mt-0.5" style={{ marginLeft: `${level * 32 + 8}px` }} />
            )}
        </div>
    )
}

export default TreeItem
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    FolderTree,
    Package,
    Eye,
    EyeOff,
    GripVertical,
    ArrowUp,
    ArrowDown,
    CornerDownRight,
} from "lucide-react"
import Image from "next/image"
import AddNewCategory from "@/components/forms/category/add-new-category"
import { useQuery } from "@tanstack/react-query"
import { changeCategoryStatus, getAllCategoriesAdmin, moveCategory } from "@/services/category.service"
import { Category } from "@/types/category"
import EditCategory from "@/components/forms/category/edit-category"
import { AlertDialog } from "@/components/ui/alert-dialog"
import DeleteCategory from "@/components/forms/category/delete-category"
import TreeItem from "@/components/category/category-tree"
import { queryClient } from "@/components/QueryClientProviders"


export default function CategoriesContent() {
    const {
        data
        // refetch
    } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: getAllCategoriesAdmin,
    })
    const [categories, setCategories] = useState<Category[]>(data || [])
    useEffect(() => {
        if (data) {
            setCategories(data)
        }
    }, [data])
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["1", "2", "3"]))

    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [filterParent, setFilterParent] = useState<string>("all")
    const [draggedCategory, setDraggedCategory] = useState<Category | null>(null)


    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category>()

    // Form state

    // Get parent categories (categories without parent)

    // Filter categories
    const filteredCategories = categories.filter((category) => {
        const matchesSearch =
            category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            category.slug.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && category.isActive) ||
            (filterStatus === "inactive" && !category.isActive)
        // const matchesParent =
        //     filterParent === "all" || (filterParent === "root" && !category.parent) || category.parent === filterParent
        return matchesSearch && matchesStatus
    })

    // Stats
    const totalCategories = categories.length
    const activeCategories = categories.filter((c) => c.isActive).length
    const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0)

    const rootCategories = categories.filter((cat) => !cat.parent).sort((a, b) => a.order - b.order)
    const getChildren = (parent: string) => categories.filter((cat) => cat.parent === parent).sort((a, b) => a.order - b.order)
    // Get parent categories for filter

    // Open edit dialog
    const openEditDialog = (category: Category) => {
        setSelectedCategory(category)
        setIsEditDialogOpen(true)
    }

    // Open delete dialog
    const openDeleteDialog = (category: Category) => {
        setSelectedCategory(category)
        setIsDeleteDialogOpen(true)
    }

    const handleChangeStatus = async (categoryId: string) => {
        await changeCategoryStatus(categoryId)
    }

    // Toggle category status
    const toggleCategoryStatus = (categoryId: string) => {
        const categoryIndex = categories.findIndex((c) => c._id === categoryId)
        if (categoryIndex === -1) return
        const updatedCategories = [...categories]
        updatedCategories[categoryIndex].isActive = !updatedCategories[categoryIndex].isActive
        setCategories(updatedCategories)
        handleChangeStatus(categoryId)
    }

    const filteredRootCategories = searchQuery
        ? categories.filter(
            (cat) =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cat.slug.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        : rootCategories

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const expandAll = () => {
        const allIds = categories.filter((c) => !c.parent).map((c) => c._id)
        setExpandedIds(new Set(allIds))
    }

    // Collapse all
    const collapseAll = () => {
        setExpandedIds(new Set())
    }

    const moveUp = async (category: Category) => {
        const siblings = categories.filter((c) => c.parent === category.parent).sort((a, b) => a.order - b.order)
        const index = siblings.findIndex((c) => c._id === category._id)
        if (index > 0) {
            const prevSibling = siblings[index - 1]
            setCategories(
                categories.map((c) => {
                    if (c._id === category._id) return { ...c, order: prevSibling.order }
                    if (c._id === prevSibling._id) return { ...c, order: category.order }
                    return c
                }),
            )
            await handleMoveCategory(category._id, prevSibling._id, "before")
        }
    }

    // Move category down
    const moveDown = async (category: Category) => {
        const siblings = categories.filter((c) => c.parent === category.parent).sort((a, b) => a.order - b.order)
        const index = siblings.findIndex((c) => c._id === category._id)
        if (index < siblings.length - 1) {
            const nextSibling = siblings[index + 1]
            setCategories(
                categories.map((c) => {
                    if (c._id === category._id) return { ...c, order: nextSibling.order }
                    if (c._id === nextSibling._id) return { ...c, order: category.order }
                    return c
                }),
            )
            await handleMoveCategory(category._id, nextSibling._id, "after")
        }
    }

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, category: Category) => {
        setDraggedCategory(category)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = async (
        e: React.DragEvent,
        targetCategory: Category,
        position: "before" | "after" | "inside"
    ) => {
        e.preventDefault()

        if (!draggedCategory || draggedCategory._id === targetCategory._id) {
            setDraggedCategory(null)
            return
        }

        const isDescendant = (parentId: string, childId: string): boolean => {
            const children = categories.filter(c => c.parent === parentId)
            for (const child of children) {
                if (child._id === childId) return true
                if (isDescendant(child._id, childId)) return true
            }
            return false
        }

        if (isDescendant(draggedCategory._id, targetCategory._id)) {
            setDraggedCategory(null)
            return
        }

        let newParentId: string | null
        let newOrder: number

        if (position === "inside") {
            newParentId = targetCategory._id
            const children = categories.filter(c => c.parent === newParentId)
            newOrder = children.length ? Math.max(...children.map(c => c.order)) + 1 : 1

            setExpandedIds(prev => new Set([...prev, targetCategory._id]))
        } else {
            newParentId = targetCategory.parent

            const siblings = categories
                .filter(c => c.parent === newParentId && c._id !== draggedCategory._id)
                .sort((a, b) => a.order - b.order)

            const targetIndex = siblings.findIndex(c => c._id === targetCategory._id)
            const insertIndex = position === "before" ? targetIndex : targetIndex + 1

            const reordered = [...siblings]
            reordered.splice(insertIndex, 0, draggedCategory)

            setCategories(categories.map(c => {
                const index = reordered.findIndex(r => r._id === c._id)
                if (c._id === draggedCategory._id) {
                    return { ...c, parent: newParentId, order: insertIndex + 1 }
                }
                if (index !== -1 && c.parent === newParentId) {
                    return { ...c, order: index + 1 }
                }
                return c
            }))

            setDraggedCategory(null)

            // ✅ GỌI API
            await handleMoveCategory(draggedCategory._id, targetCategory._id, position)
            return
        }

        setCategories(categories.map(c =>
            c._id === draggedCategory._id
                ? { ...c, parent: newParentId, order: newOrder }
                : c
        ))

        setDraggedCategory(null)

        // ✅ GỌI API
        await handleMoveCategory(draggedCategory._id, targetCategory._id, position)
    }

    const handleMoveCategory = async (categoryId: string, targetId: string | null, position: 'inside' | 'before' | 'after') => {
        try {
            await moveCategory(categoryId, targetId, position);
            queryClient.invalidateQueries({ queryKey: ['categories-for-select'] });
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
                    <p className="text-muted-foreground">Quản lý các danh mục sản phẩm trong cửa hàng</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm danh mục
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <FolderTree className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalCategories}</p>
                                <p className="text-sm text-muted-foreground">Tổng danh mục</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Eye className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeCategories}</p>
                                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <FolderTree className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{rootCategories.length}</p>
                                <p className="text-sm text-muted-foreground">Danh mục gốc</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <Package className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalProducts}</p>
                                <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Cây danh mục</CardTitle>
                            <CardDescription>Kéo thả danh mục để thay đổi vị trí và cấu trúc cha-con</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm danh mục..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={expandAll}>
                                Mở tất cả
                            </Button>
                            <Button variant="outline" size="sm" onClick={collapseAll}>
                                Thu gọn
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4" />
                            <span>Kéo để di chuyển</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowUp className="h-4 w-4" />
                            <ArrowDown className="h-4 w-4" />
                            <span>Di chuyển lên/xuống</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CornerDownRight className="h-4 w-4" />
                            <span>Thả vào giữa để làm danh mục con</span>
                        </div>
                    </div>

                    {/* Tree */}
                    <div className="border rounded-lg divide-y">
                        {searchQuery ? (
                            // Search results - flat list
                            filteredRootCategories.length > 0 ? (
                                <div className="p-2 space-y-1">
                                    {filteredRootCategories.map((category) => {
                                        const parent = category.parent ? categories.find((c) => c._id === category.parent) : null
                                        return (
                                            <div
                                                key={category._id}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{category.name}</span>
                                                        {parent && (
                                                            <Badge variant="outline" className="text-xs">
                                                                trong {parent.name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => openEditDialog(category)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => openDeleteDialog(category)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">Không tìm thấy danh mục nào</p>
                                </div>
                            )
                        ) : (
                            // Tree view
                            <div className="p-2 space-y-1">
                                {rootCategories.map((category, index) => (
                                    <TreeItem
                                        key={category._id}
                                        category={category}
                                        children={getChildren(category._id)}
                                        level={0}
                                        expandedIds={expandedIds}
                                        onToggleExpand={toggleExpand}
                                        onEdit={openEditDialog}
                                        onDelete={openDeleteDialog}
                                        onToggleStatus={toggleCategoryStatus}
                                        onMoveUp={moveUp}
                                        onMoveDown={moveDown}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        isFirst={index === 0}
                                        isLast={index === rootCategories.length - 1}
                                        allCategories={categories}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {rootCategories.length === 0 && !searchQuery && (
                        <div className="text-center py-12">
                            <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">Chưa có danh mục nào</p>
                            <Button onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm danh mục đầu tiên
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Category Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <AddNewCategory categories={rootCategories} setIsAddDialogOpen={setIsAddDialogOpen} />
            </Dialog>

            {/* Edit Category Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                {
                    selectedCategory &&
                    <EditCategory categories={categories} selectedCategory={selectedCategory!} setIsEditDialogOpen={setIsEditDialogOpen} />
                }
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DeleteCategory selectedCategory={selectedCategory!} setIsDeleteDialogOpen={setIsDeleteDialogOpen} />
            </Dialog>
        </div>
    )
}

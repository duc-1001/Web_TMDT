'use client'
import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Plus,
    AlertTriangle,
    Pencil,
    History,
    TrendingDown
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { useQuery, useMutation } from "@tanstack/react-query"
import { getProductBatchesAdmin, updateBatchQuantity, createProductBatch } from "@/services/product.service"
import { ProductBatch } from "@/types/product"
import PaginationControls from "@/components/layout/pagination-controls-admin"
import { toast } from "sonner"
import { queryClient } from "@/components/QueryClientProviders"
import { Alert } from "@/components/ui/alert"
import CreateNewBatch from "@/components/forms/product_batch/create-new-batch"
import UpdateBatch from "@/components/forms/product_batch/update-batch"

// ---------------- STATUS BADGE ----------------
function statusBadge(status: "active" | "expired" | "sold_out" | "near_expiry" | "disposed") {
    if (status === "sold_out") {
        return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">Hết hàng</Badge>
    }


    if (status === "expired") {
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Hết hạn</Badge>
    }

    if (status === "near_expiry") {
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Sắp hết hạn</Badge>
    }

    if (status === "disposed") {
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Đã thanh lý</Badge>
    }

    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Còn hàng</Badge>
}

interface ProductBatchesPageProps {
    productId: string
}

export default function ProductBatchesPage({ productId }: ProductBatchesPageProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [openNewBatchDialog, setOpenNewBatchDialog] = useState(false)
    const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null)
    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ["product-batches", productId, currentPage, itemsPerPage],
        queryFn: () => getProductBatchesAdmin(productId, currentPage, itemsPerPage),
        enabled: !!productId,
    })
    const batches = data?.data || [];
    const totalPages = data?.pagination.totalPages || 0;
    const totalItems = data?.pagination.total || 0;

    // Mutations

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/products/${productId}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý lô nhập kho</h1>
                        <p className="text-sm text-muted-foreground italic">Mã sản phẩm: {productId}</p>
                    </div>
                </div>

                {/* DIALOG: NHẬP KHO MỚI */}
                <Dialog open={openNewBatchDialog} onOpenChange={setOpenNewBatchDialog}>
                    <DialogTrigger asChild>
                        <Button className="shadow-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Nhập lô hàng mới
                        </Button>
                    </DialogTrigger>
                    <CreateNewBatch productId={productId} setOpenNewBatchDialog={setOpenNewBatchDialog} currentPage={currentPage} itemsPerPage={itemsPerPage} />
                </Dialog>
            </div>
            {/* Thông tin FEFO */}
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <p className="text-xs">
                    <b>Quy tắc xuất kho:</b> Hệ thống tự động ưu tiên xuất các lô có <b>Hạn sử dụng gần nhất (FEFO)</b> để giảm thiểu thất thoát.
                </p>
            </Alert>

            {/* TABLE */}
            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        Lịch sử nhập & Tồn kho thực tế
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="pl-6">Ngày nhập</TableHead>
                                <TableHead className="text-right">Giá nhập</TableHead>
                                <TableHead className="text-right">Ban đầu / Còn lại</TableHead>
                                <TableHead className="text-right font-bold text-orange-500">Giá trị tồn</TableHead>
                                <TableHead>Hạn sử dụng</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right pr-6">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batches.map(batch => {
                                // LOGIC KIỂM TRA KHÓA CHỈNH SỬA
                                const isLocked = ["expired", "disposed", "sold_out"].includes(batch.status);

                                return (
                                    <TableRow key={batch._id} className={isLocked ? "bg-muted/30" : ""}>
                                        <TableCell className="pl-6 font-medium text-muted-foreground">
                                            {new Date(batch.importedAt).toLocaleDateString('vi-VN')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {Number(batch.importPrice).toLocaleString()}₫
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-muted-foreground">{batch.quantity}</span>
                                            <span className="mx-1">/</span>
                                            <span className={`font-bold ${batch.remainingQuantity === 0 ? "text-muted-foreground" : ""}`}>
                                                {batch.remainingQuantity}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-orange-500">
                                            {(batch.remainingQuantity * (batch.importPrice || 0)).toLocaleString()}₫
                                        </TableCell>
                                        <TableCell>
                                            <span className={new Date(batch.expirationDate) < new Date() ? "text-red-500 font-bold" : ""}>
                                                {new Date(batch.expirationDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        </TableCell>
                                        <TableCell>{statusBadge(batch.status)}</TableCell>

                                        <TableCell className="text-right pr-6">
                                            {/* Chỉ hiển thị Dialog khi không bị khóa */}
                                            <Button
                                                size="sm"
                                                variant={isLocked ? "ghost" : "outline"}
                                                disabled={isLocked}
                                                onClick={() => setEditingBatch(batch)}
                                                className={isLocked ? "cursor-not-allowed opacity-50" : ""}
                                            >
                                                {isLocked ? (
                                                    <span className="flex items-center text-xs">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Đã khóa
                                                    </span>
                                                ) : (
                                                    <>
                                                        <Pencil className="h-3 w-3 mr-1" />
                                                        Điều chỉnh
                                                    </>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!editingBatch} onOpenChange={val => !val && setEditingBatch(null)}>
                {
                    editingBatch && (
                        <UpdateBatch batchEditData={editingBatch!} productId={productId} currentPage={currentPage} itemsPerPage={itemsPerPage} setEditingBatch={setEditingBatch} />
                    )
                }
            </Dialog>

            <PaginationControls
                totalPages={totalPages}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                setCurrentPage={setCurrentPage}
                setItemsPerPage={setItemsPerPage}
                totalItems={totalItems}
            />
        </div>
    )
}
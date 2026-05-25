"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Edit2, Plus, Eye, Zap, Search, Download, Copy, Power, PowerOff, Star } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { exportDiscounts, getDiscountsAdmin, toggleDiscountFeature } from "@/services/discount.service"
import useDebounce from "@/hooks/use-debounce"
import PaginationControls from "@/components/layout/pagination-controls-admin"
import { formatDate } from "@/lib/utils"
import EditDiscount from "@/components/forms/discount/edit-discount"
import { queryClient } from "@/components/QueryClientProviders"
import { PaginatedData } from "@/types/commons"
import { DiscountAdmin } from "@/types/discount"
import DeleteDiscount from "@/components/forms/discount/delete-discount"
import CreateNewDiscount from "@/components/forms/discount/create-new-discount"


export default function DiscountsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [statusFilter, setStatusFilter] = useState("all")
    const q = useDebounce(searchTerm, 300)
    const { data, isLoading } = useQuery({
        queryKey: ['discounts-admin', q, currentPage, itemsPerPage, statusFilter],
        queryFn: () => getDiscountsAdmin(q, currentPage, itemsPerPage, statusFilter)
    })

    const Discounts: DiscountAdmin[] = data?.data || []
    const totalPages = data?.pagination?.totalPages || 1
    const totalItems = data?.pagination?.total || 0

    const [openDialog, setOpenDialog] = useState(false)
    const [openEditDialog, setOpenEditDialog] = useState(false)
    const [openDeleteDialog, setDeleteDialogOpen] = useState(false)
    const [selectedDiscount, setSelectedDiscount] = useState<DiscountAdmin | null>(null)
    const [viewDetail, setViewDetail] = useState<DiscountAdmin | null>(null)

    const handleToggleActive = (id: string) => {
    }

    const handleToggleFeature = async (id: string) => {
        
        const oldData = queryClient.getQueryData(['discounts-admin', q, currentPage, itemsPerPage, statusFilter]);
        try {
            queryClient.setQueryData(['discounts-admin', q, currentPage, itemsPerPage, statusFilter], (oldData: PaginatedData<DiscountAdmin>) => {
                if (!oldData) return oldData;
                const newDiscounts = oldData.data.map((Discount: DiscountAdmin) => {
                    if (Discount._id === id) {
                        return { ...Discount, isFeature: !Discount.isFeature };
                    }
                    return Discount;
                });
                return { ...oldData, data: newDiscounts };
            });
            await toggleDiscountFeature(id);
        } catch (error) {
            queryClient.setQueryData(['discounts-admin', q, currentPage, itemsPerPage, statusFilter], oldData);
        }
    }

    const handleEditDiscount = (Discount: DiscountAdmin) => {
        setSelectedDiscount(Discount)
        setOpenEditDialog(true)
    }

    const handleDeleteDiscount = (Discount: DiscountAdmin) => {
        setSelectedDiscount(Discount)
        setDeleteDialogOpen(true)
    }

    const getDiscountTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            percentage: "Phần trăm",
            fixed: "Số tiền cố định",
            shipping: "Miễn phí vận chuyển",
            buy_x_get_y: "Mua X tặng Y",
        }
        return labels[type] || type
    }

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            low: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
            medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
            high: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        }
        const labels: Record<string, string> = { low: "Thấp", medium: "Trung bình", high: "Cao" }
        return (
            <Badge className={styles[priority as keyof typeof styles]}>
                {labels[priority as keyof typeof labels]}
            </Badge>
        )
    }

    const exportData = async () => {
        const blob = await exportDiscounts();

        const url = window.URL.createObjectURL(
            new Blob([blob], { type: "text/csv;charset=utf-8;" })
        );

        const a = document.createElement("a");
        a.href = url;
        a.download = `Discounts-${new Date().toISOString().split("T")[0]}.csv`;

        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);
    };



    const DiscountBadge = ({ Discount }: { Discount: DiscountAdmin }) => {
        const status = Discount.status
        if (status === "active") {
            return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Hoạt động</Badge>
        } else if (status === "expired") {
            return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 text-xs">Hết hạn</Badge>
        } else if (status === "scheduled") {
            return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">Đang lên lịch</Badge>
        } else if (status === "exhausted") {
            return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">Hết lượt dùng</Badge>
        } else {
            return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 text-xs">Không hoạt động</Badge>
        }
    }

    return (
        <div>
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Khuyến mãi</h1>
                        <p className="text-muted-foreground">Tạo và quản lý chương trình khuyến mãi</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportData} className="gap-2 bg-transparent">
                            <Download className="h-4 w-4" />
                            Xuất CSV
                        </Button>
                        <Button onClick={() => setOpenDialog(true)} className="bg-orange-600 hover:bg-orange-700 gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm khuyến mãi
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm theo mã, tên hoặc mô tả..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue={statusFilter} onValueChange={setStatusFilter} >
                    <TabsList>
                        <TabsTrigger className="px-4" value="all">Tất cả </TabsTrigger>
                        <TabsTrigger className="px-4" value="active">Hoạt động</TabsTrigger>
                        <TabsTrigger className="px-4" value="expired">Hết hạn</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-3">
                        {Discounts.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <p className="text-muted-foreground">Chưa có khuyến mãi nào.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {Discounts.map((Discount) => (
                                    <Card
                                        key={Discount._id}
                                        className={`
                                                    ${Discount.status === "expired" ? "opacity-60" : ""}
                                                    hover:shadow-md transition-shadow duration-200
                                                `}
                                    >
                                        <CardContent className="p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">

                                                {/* Phần thông tin chính - chiếm hết trên mobile, flex-1 trên desktop */}
                                                <div className="flex-1 space-y-3 sm:space-y-4">

                                                    {/* Header: code + name + badge */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold text-base sm:text-lg">
                                                            {Discount.name || "Chưa đặt tên"}
                                                        </h3>

                                                        {Discount.isFeature && <Star className="text-yellow-400 h-5 w-5 fill-current" />}
                                                        <DiscountBadge Discount={Discount} />
                                                    </div>

                                                    {/* Mô tả - giới hạn dòng trên mobile */}
                                                    {Discount.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
                                                            {Discount.description}
                                                        </p>
                                                    )}

                                                    {/* Badges - wrap tốt hơn */}
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="outline" className="text-xs sm:text-sm">
                                                            {getDiscountTypeLabel(Discount.type)}
                                                        </Badge>
                                                        {getPriorityBadge(Discount.priority)}
                                                        {Discount.stackable && (
                                                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                                                                Kết hợp được
                                                            </Badge>
                                                        )}
                                                        {Discount.userCondition !== "all" && (
                                                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                                                {Discount.userCondition === "new" ? "Người mới" : "VIP"}
                                                            </Badge>
                                                        )}
                                                        {!Discount.isActive && (
                                                            <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 text-xs">
                                                                Tắt
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Grid thông tin chi tiết - responsive columns */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3 sm:gap-4 text-xs sm:text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground mb-0.5">Loại áp dụng</p>
                                                            <p className="font-medium">
                                                                {Discount.applyTo === "order" ? "Đơn hàng" : "Sản phẩm"}
                                                            </p>
                                                        </div>

                                                        {Discount.type === "percentage" && (
                                                            <>
                                                                <div>
                                                                    <p className="text-muted-foreground mb-0.5">Giảm</p>
                                                                    <p className="font-medium">{Discount.value}%</p>
                                                                </div>
                                                                {Discount.maxDiscountValue && (
                                                                    <div>
                                                                        <p className="text-muted-foreground mb-0.5">Tối đa</p>
                                                                        <p className="font-medium">
                                                                            {Discount.maxDiscountValue.toLocaleString("vi-VN")}đ
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {Discount.type === "fixed" && (
                                                            <div>
                                                                <p className="text-muted-foreground mb-0.5">Giảm</p>
                                                                <p className="font-medium">
                                                                    {Discount.value?.toLocaleString("vi-VN")}đ
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <p className="text-muted-foreground mb-0.5">Tối thiểu</p>
                                                            <p className="font-medium">
                                                                {Discount.minOrderValue.toLocaleString("vi-VN")}đ
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-muted-foreground mb-0.5">Thời gian</p>
                                                            <p className="font-medium white-space-nowrap">
                                                                {formatDate(Discount.startDate)}
                                                                {" - "}
                                                                {formatDate(Discount.endDate)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground mb-0.5">Sử dụng</p>
                                                            <p className="font-medium">
                                                                {Discount.usageCount} / {Discount.maxUsageCount || "∞"}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-muted-foreground mb-0.5">Số lần sử dụng</p>
                                                            <p className="font-medium">
                                                                {Discount.maxUsagePerUser || Discount.maxUsageCount || "∞"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action buttons - luôn ở dưới trên mobile, bên phải trên desktop */}
                                                <div className="flex sm:flex-col gap-2 sm:gap-1 mt-3 sm:mt-0 justify-end sm:justify-start">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 sm:h-10 sm:w-10"
                                                        onClick={() => setViewDetail(Discount)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </Button>

                                                    {/* <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 sm:h-10 sm:w-10"
                                                        onClick={() => handleToggleActive(Discount._id)}
                                                        title={Discount.isActive ? "Tắt" : "Bật"}
                                                    >
                                                        {Discount.isActive ? (
                                                            <Power className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        ) : (
                                                            <PowerOff className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        )}
                                                    </Button> */}

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 sm:h-10 sm:w-10"
                                                        onClick={() => handleToggleFeature(Discount._id)}
                                                        title={Discount.isFeature ? "Tắt nổi bật" : "Bật nổi bật"}
                                                    >
                                                        {Discount.isFeature ? (
                                                            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                                                        ) : (
                                                            <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        )}
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 sm:h-10 sm:w-10"
                                                        onClick={() => handleEditDiscount(Discount)} // ← Nên truyền Discount để edit đúng item
                                                        title="Sửa"
                                                    >
                                                        <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 sm:h-10 sm:w-10 text-destructive hover:text-destructive/90"
                                                        onClick={() => handleDeleteDiscount(Discount)}
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="active" className="space-y-4 sm:space-y-3">
                        {Discounts.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="p-8 sm:p-12 text-center">
                                    <p className="text-muted-foreground text-base sm:text-lg">
                                        Không có khuyến mãi nào đang hoạt động.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 sm:gap-3">
                                {Discounts
                                    .map((Discount) => (
                                        <Card
                                            key={Discount._id}
                                            className="
                                                        border-green-200 dark:border-green-900/20
                                                        hover:shadow-md transition-all duration-200
                                                        "
                                        >
                                            <CardContent className="p-4 sm:p-6">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                                                    {/* Nội dung chính */}
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-semibold text-base sm:text-lg">
                                                                {Discount.name || "Chưa đặt tên"}
                                                            </h3>
                                                            {getPriorityBadge(Discount.priority)}
                                                        </div>

                                                        {Discount.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
                                                                {Discount.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Buttons */}
                                                    <div className="flex gap-2 sm:gap-1 justify-end sm:justify-start">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 sm:h-10 sm:w-10"
                                                            onClick={() => setViewDetail(Discount)}
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 sm:h-10 sm:w-10"
                                                            onClick={() => handleEditDiscount(Discount)}
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="expired" className="space-y-4 sm:space-y-3">
                        {Discounts.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="p-8 sm:p-12 text-center">
                                    <p className="text-muted-foreground text-base sm:text-lg">
                                        Không có khuyến mãi nào hết hạn.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 sm:gap-3">
                                {Discounts
                                    .map((Discount) => (
                                        <Card
                                            key={Discount._id}
                                            className="
                                                            opacity-70 hover:opacity-90 transition-opacity duration-200
                                                        "
                                        >
                                            <CardContent className="p-4 sm:p-6">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                                                    <div className="flex-1 space-y-2 sm:space-y-3">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-semibold text-base sm:text-lg">
                                                                {Discount.name || "Chưa đặt tên"}
                                                            </h3>
                                                        </div>

                                                        <p className="text-sm text-muted-foreground">
                                                            Hết hạn ngày {Discount.endDate ? formatDate(Discount.endDate) : "N/A"}
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 sm:h-10 sm:w-10 text-destructive hover:text-destructive/90 self-start sm:self-center"
                                                        onClick={() => handleDeleteDiscount(Discount)}
                                                        title="Xóa khuyến mãi"
                                                    >
                                                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Add/Edit Dialog */}
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <CreateNewDiscount setOpenDialog={setOpenDialog} />
                </Dialog>

                <Dialog open={openEditDialog} onOpenChange={() => { setOpenEditDialog(false); setSelectedDiscount(null); }}>
                    {
                        selectedDiscount && <EditDiscount
                            discount={selectedDiscount}
                            setOpenEditDialog={setOpenEditDialog}
                            setSelectedDiscount={setSelectedDiscount}
                        />
                    }
                </Dialog>

                <Dialog open={openDeleteDialog} onOpenChange={() => setDeleteDialogOpen(false)}>
                    {
                        selectedDiscount && <DeleteDiscount
                            selectedDiscount={selectedDiscount}
                            setDeleteDialogOpen={setDeleteDialogOpen}
                        />
                    }
                </Dialog>

                {/* View Detail Modal */}
                <Dialog open={!!viewDetail} onOpenChange={() => setViewDetail(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {viewDetail?.name}
                                {viewDetail?.isFeature && <Star className="text-yellow-400 fill-current" />}
                            </DialogTitle>
                        </DialogHeader>

                        {viewDetail && (
                            <div className="space-y-4">
                                <div className="w-full ">
                                    <img src={viewDetail.image} alt={viewDetail.name} className="w-full aspect-video object-cover rounded-md" />
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Mô tả</h4>
                                    <p className="text-sm text-muted-foreground">{viewDetail.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground mb-1">Loại khuyến mãi</p>
                                        <p className="font-medium">{getDiscountTypeLabel(viewDetail.type)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Áp dụng cho</p>
                                        <p className="font-medium">{viewDetail.applyTo === "order" ? "Đơn hàng" : "Sản phẩm"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Mức ưu tiên</p>
                                        {getPriorityBadge(viewDetail.priority)}
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Điều kiện người dùng</p>
                                        <p className="font-medium">
                                            {viewDetail.userCondition === "all" ? "Tất cả" : viewDetail.userCondition === "new" ? "Người dùng mới" : "VIP"}
                                        </p>
                                    </div>
                                </div>

                                {(viewDetail.value || viewDetail.maxDiscountValue) && (
                                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded">
                                        <div>
                                            <p className="text-muted-foreground mb-1">Giá trị giảm</p>
                                            <p className="font-bold text-lg">
                                                {viewDetail.type === "percentage" ? `${viewDetail.value}%` : `${viewDetail.value?.toLocaleString("vi-VN")}đ`}
                                            </p>
                                        </div>
                                        {viewDetail.maxDiscountValue && (
                                            <div>
                                                <p className="text-muted-foreground mb-1">Giảm tối đa</p>
                                                <p className="font-bold text-lg">{viewDetail.maxDiscountValue.toLocaleString("vi-VN")}đ</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground mb-1">Giá trị đơn tối thiểu</p>
                                        <p className="font-medium">{viewDetail.minOrderValue.toLocaleString("vi-VN")}đ</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Thời gian</p>
                                        <p className="font-medium text-xs">
                                            {formatDate(viewDetail.startDate)} đến {formatDate(viewDetail.endDate)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Tổng sử dụng</p>
                                        <p className="font-medium">{viewDetail.usageCount} / {viewDetail.maxUsageCount || "∞"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Sử dụng/người dùng</p>
                                        <p className="font-medium">{viewDetail.maxUsagePerUser || "∞"}</p>
                                    </div>
                                </div>


                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={viewDetail.stackable}
                                            readOnly
                                            className="rounded"
                                        />
                                        <p className="text-muted-foreground">Có thể kết hợp với khuyến mãi khác</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={viewDetail.isActive}
                                            readOnly
                                            className="rounded"
                                        />
                                        <p className="text-muted-foreground">Khuyến mãi hoạt động</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setViewDetail(null)}>
                                        Đóng
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            handleEditDiscount(viewDetail)
                                            setViewDetail(null)
                                        }}
                                        className="gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Chỉnh sửa
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
            <div className="mt-5">
                <PaginationControls setItemsPerPage={setItemsPerPage} itemsPerPage={itemsPerPage} totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage} totalItems={totalItems} />
            </div>
        </div>
    )
}

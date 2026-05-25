"use client"

import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Eye, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Banknote, 
  Calendar,
  Search,
  ArrowUpDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// --- 1. MOCK DATA (Dữ liệu mẫu) ---
const mockRefunds = [
  {
    _id: '69a96e1bb50b0c0b6b0c8df4',
    orderCode: 'ORDF2B16018',
    refundCode: 'REF7A9C3F21',
    status: 'pending',
    reason: 'Sản phẩm bị lỗi kỹ thuật (Hỏng vỏ)',
    refundBankInfo: {
      bankName: 'Vietcombank',
      accountNumber: '123456789',
      accountHolder: 'Đào Danh Đức'
    },
    refundAmountData: {
      totalRefund: 201600
    },
    createdAt: '2026-03-05T11:50:51.123Z'
  },
  {
    _id: '69a96e1bb50b0c0b6b0c8df5',
    orderCode: 'ORDF9A12005',
    refundCode: 'REF8B2D4E55',
    status: 'approved',
    reason: 'Giao sai màu sắc sản phẩm',
    refundBankInfo: {
      bankName: 'MB Bank',
      accountNumber: '999988887777',
      accountHolder: 'Nguyễn Văn A'
    },
    refundAmountData: {
      totalRefund: 540000
    },
    createdAt: '2026-03-04T09:20:00.000Z'
  },
  {
    _id: '69a96e1bb50b0c0b6b0c8df6',
    orderCode: 'ORDF3C44099',
    refundCode: 'REF1A5X8Z99',
    status: 'rejected',
    reason: 'Sản phẩm đã qua sử dụng, mất tem niêm phong',
    refundBankInfo: {
      bankName: 'Techcombank',
      accountNumber: '1903456789012',
      accountHolder: 'Trần Thị B'
    },
    refundAmountData: {
      totalRefund: 125000
    },
    createdAt: '2026-03-03T15:10:00.000Z'
  }
];

// --- 2. HELPER COMPONENTS ---
const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string, className: string, icon: any }> = {
    pending: { 
      label: 'Chờ xử lý', 
      className: 'bg-amber-50 text-amber-700 border-amber-200', 
      icon: Clock 
    },
    approved: { 
      label: 'Đã duyệt', 
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
      icon: CheckCircle2 
    },
    rejected: { 
      label: 'Từ chối', 
      className: 'bg-rose-50 text-rose-700 border-rose-200', 
      icon: XCircle 
    }
  }

  const config = configs[status] || { label: status, className: '', icon: Clock }
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`${config.className} gap-1.5 font-medium py-1`}>
      <Icon size={14} />
      {config.label}
    </Badge>
  )
}

// --- 3. MAIN PAGE COMPONENT ---
export default function RefundManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Hoàn tiền</h1>
            <p className="text-slate-500 text-sm">Theo dõi và phê duyệt các yêu cầu trả hàng & hoàn tiền.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Tìm mã đơn, khách hàng..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="shrink-0">Xuất file CSV</Button>
          </div>
        </div>

        {/* Table Section */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-4">
            <div className="flex justify-between items-center">
               <CardTitle className="text-lg font-semibold">Danh sách yêu cầu</CardTitle>
               <Badge variant="secondary">{mockRefunds.length} bản ghi</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="w-[140px] font-bold">Mã hoàn tiền</TableHead>
                    <TableHead className="font-bold text-slate-700">Thông tin đơn hàng</TableHead>
                    <TableHead className="font-bold text-slate-700">Khách hàng & Ngân hàng</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Số tiền</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Trạng thái</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Ngày yêu cầu</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRefunds.map((refund) => (
                    <TableRow key={refund._id} className="group transition-colors hover:bg-slate-50/80">
                      <TableCell className="font-mono font-bold text-blue-600">
                        {refund.refundCode}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">{refund.orderCode}</div>
                          <div className="text-xs text-slate-500 line-clamp-1 italic max-w-[200px]">
                            "{refund.reason}"
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-slate-800">{refund.refundBankInfo.accountHolder}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 w-fit px-1.5 py-0.5 rounded">
                            <Banknote size={12} />
                            {refund.refundBankInfo.bankName} • {refund.refundBankInfo.accountNumber}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="font-bold text-rose-600">
                          {formatCurrency(refund.refundAmountData.totalRefund)}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <StatusBadge status={refund.status} />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar size={13} />
                          {formatDate(refund.createdAt)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Footer info (Optional) */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Hiển thị dữ liệu thời gian thực từ hệ thống quản lý hoàn trả.
        </p>
      </div>
    </div>
  )
}
"use client"

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Ban } from 'lucide-react'
import { Customer, CustomerDetail } from '@/types/customer'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

interface BlockCustomerProps {
    blockDialogOpen: boolean
    setBlockDialogOpen: (open: boolean) => void
    selectedCustomer: Customer|CustomerDetail | null
    handleBlockMutation: any
}

const BLOCK_REASONS = [
    { value: "spam", label: "Spam / Lạm dụng" },
    { value: "fraud", label: "Gian lận" },
    { value: "abuse", label: "Hành vi không phù hợp" },
    { value: "other", label: "Khác" },
]

const BlockCustomer = ({
    blockDialogOpen,
    setBlockDialogOpen,
    selectedCustomer,
    handleBlockMutation
}: BlockCustomerProps) => {

    const [reasonCode, setReasonCode] = useState<string>("")
    const [reasonNote, setReasonNote] = useState<string>("")

    useEffect(() => {
        if (!blockDialogOpen) {
            setReasonCode("")
            setReasonNote("")
        }
    }, [blockDialogOpen])

    const isOther = reasonCode === "other"

    const isValid =
        reasonCode &&
        (!isOther || reasonNote.trim().length > 0)

    return (
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
            <DialogContent className="sm:max-w-md">

                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Ban className="h-5 w-5" />
                        Chặn tài khoản
                    </DialogTitle>

                    <DialogDescription>
                        Bạn có chắc chắn muốn chặn{" "}
                        <strong>{selectedCustomer?.fullName}</strong>?
                        Khách hàng sẽ không thể đăng nhập và đặt hàng.
                    </DialogDescription>
                </DialogHeader>

                {/* FORM */}
                <div className="space-y-4 mt-2">

                    {/* SELECT */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium mb-2">
                            Lý do chặn
                        </label>

                        <Select value={reasonCode} onValueChange={setReasonCode}>
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder="Chọn lý do" />
                            </SelectTrigger>

                            <SelectContent position='popper' sideOffset={4}>
                                {BLOCK_REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* TEXTAREA khi chọn OTHER */}
                    {isOther && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Nhập lý do cụ thể
                            </label>

                            <textarea
                                className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={3}
                                placeholder="Nhập lý do..."
                                value={reasonNote}
                                onChange={(e) => setReasonNote(e.target.value)}
                            />
                        </div>
                    )}

                </div>

                {/* FOOTER */}
                <DialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setBlockDialogOpen(false)}
                    >
                        Hủy
                    </Button>

                    <Button
                        variant="destructive"
                        disabled={!isValid || handleBlockMutation.isPending}
                        onClick={async () => {
                            if (!selectedCustomer) return

                            await handleBlockMutation.mutateAsync({
                                customerId: selectedCustomer._id,
                                reasonCode,
                                reasonNote: isOther
                                    ? reasonNote
                                    : BLOCK_REASONS.find(r => r.value === reasonCode)?.label
                            })

                            setBlockDialogOpen(false)
                        }}
                    >
                        {handleBlockMutation.isPending
                            ? "Đang chặn..."
                            : "Chặn tài khoản"}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}

export default BlockCustomer
import React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Send } from 'lucide-react'
import { sendEmailToCustomer } from '@/services/customer.service'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

interface SendEmailToManyCustomerProps {
    emailDialogOpen: boolean;
    setEmailDialogOpen: (open: boolean) => void;
    selectedCustomers: string[]; 
    setSelectedCustomers:React.Dispatch<React.SetStateAction<string[]>>;
}

const SendEmailToManyCustomer = ({ emailDialogOpen, setEmailDialogOpen, selectedCustomers, setSelectedCustomers }: SendEmailToManyCustomerProps) => {
    const [emailSubject, setEmailSubject] = React.useState("")
    const [emailContent, setEmailContent] = React.useState("")

    const handleSendEmail = useMutation({
        mutationFn: async () => {
            await sendEmailToCustomer(selectedCustomers, emailSubject, emailContent)
        },
        onSuccess: () => {
            toast.success("Email đã được gửi thành công!")
            setEmailDialogOpen(false)
            setSelectedCustomers([])
            setEmailSubject("")
            setEmailContent("")
        },
        onError: () => {
            toast.error("Có lỗi xảy ra khi gửi email. Vui lòng thử lại.")
        }
    })

    return (
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Gửi email hàng loạt
                    </DialogTitle>
                    <DialogDescription>
                        Gửi email đến <strong>{selectedCustomers.length}</strong> khách hàng đã chọn
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Tiêu đề</label>
                        <Input
                            placeholder="Nhập tiêu đề email..."
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Nội dung</label>
                        <Textarea
                            placeholder="Nhập nội dung email..."
                            value={emailContent}
                            onChange={(e) => setEmailContent(e.target.value)}
                            className="min-h-32 resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                        Hủy
                    </Button>
                    <Button
                        onClick={() => handleSendEmail.mutate()}
                        disabled={!emailSubject || !emailContent || handleSendEmail.isPending}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Gửi ngay
                    </Button>
                </  DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default SendEmailToManyCustomer

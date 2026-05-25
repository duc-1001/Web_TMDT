import { queryClient } from '@/components/QueryClientProviders';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deleteBanner } from '@/services/banner.service';
import { HeroBanner } from '@/types/banner';
import React from 'react'
import { toast } from 'sonner';
interface DeleteHeroProps {
    selectedBanner: HeroBanner;
    setOpenDeleteDialog: React.Dispatch<React.SetStateAction<boolean>>;
}
const DeleteHero = ({ selectedBanner, setOpenDeleteDialog }: DeleteHeroProps) => {
    const [submitting, setSubmitting] = React.useState(false);

    const handleDeleteBanner = async () => {
        setSubmitting(true);
        try {
            // Call deleteBanner service here
            await deleteBanner(selectedBanner._id);
            setOpenDeleteDialog(false);
            queryClient.invalidateQueries({ queryKey: ['hero-banners-admin'] });
            toast.success('Xóa banner thành công');
        }
        catch (error) {
            console.error("Lỗi khi xóa banner:", error);
        } finally {
            setSubmitting(false);
        }
    }
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Xác nhận xóa banner</DialogTitle>
                <DialogDescription>
                    Bạn có chắc chắn muốn xóa banner "{selectedBanner?.title}"? Hành động này không thể hoàn tác.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => setOpenDeleteDialog(false)}
                    className="bg-transparent"
                    disabled={submitting}
                >
                    Hủy
                </Button>
                <Button variant="destructive" onClick={handleDeleteBanner} disabled={submitting}>
                    Xóa banner
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default DeleteHero

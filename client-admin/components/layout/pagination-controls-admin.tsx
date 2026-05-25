import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import React from 'react'
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

interface PaginationControlsProps {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    totalItems,
    itemsPerPage,
    currentPage,
    setItemsPerPage,
    setCurrentPage,
    totalPages
}) => {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm ">
                <span>Hiển thị</span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                        setItemsPerPage(Number(v))
                        setCurrentPage(1)
                    }}
                >
                    <SelectTrigger className="w-20 h-8 border-gray-700 rounded ">
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent position="popper" sideOffset={4}>
                        {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option.toString()}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span> trên {totalItems} sản phẩm</span>
            </div>

            <div className="flex items-center gap-2 z-0">
                <span className="text-sm ">
                    Trang {currentPage} / {totalPages || 1}
                </span>

                <div className="flex items-center gap-1 z-0">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default PaginationControls;

import React from "react"
import { Trash2, X } from "lucide-react"

interface DeleteReviewUserProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  disabled?: boolean
}

const DeleteReviewUser = ({ open, onClose, onConfirm, disabled = false }: DeleteReviewUserProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-80 max-w-full">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-semibold text-red-600">Xóa đánh giá</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 text-sm text-gray-700">
          Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteReviewUser
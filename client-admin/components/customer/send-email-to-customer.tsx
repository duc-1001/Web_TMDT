import { sendEmailToCustomer } from "@/services/customer.service";
import { Customer, CustomerDetail } from "@/types/customer";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { toast } from "sonner";

interface SendEmailToCustomerProps {
  open: boolean;
  onClose: () => void;
  customer: Customer|CustomerDetail | null;
}

const SendEmailToCustomer = ({ open, onClose, customer }: SendEmailToCustomerProps) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const handleSend = useMutation({
    mutationFn: async () => {
      if (!customer) return;
      await sendEmailToCustomer([customer.email], subject, content);
    },
    onSuccess: () => {
      toast.success("Email đã được gửi thành công!");
      onClose();
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi gửi email. Vui lòng thử lại.");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-[520px] rounded-2xl shadow-2xl p-6 animate-fadeIn">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Gửi email cho khách hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        {/* Email */}
        <p className="text-sm text-gray-500 mb-3">
          Người nhận: <span className="font-medium">{customer?.email}</span>
        </p>

        {/* Subject */}
        <input
          className="w-full border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none rounded-lg px-3 py-2 mb-3 transition"
          placeholder="Tiêu đề email..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        {/* Content */}
        <textarea
          className="w-full border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none rounded-lg px-3 py-2 h-36 mb-4 resize-none transition"
          placeholder="Nhập nội dung email..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-100 transition"
          >
            Huỷ
          </button>

          <button
            disabled={handleSend.isPending}
            onClick={() => handleSend.mutate()}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition shadow"
          >
            {handleSend.isPending ? "Đang gửi..." : "Gửi email"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendEmailToCustomer;
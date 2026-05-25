'use client';

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Settings, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-200 p-4 relative overflow-hidden">
      {/* Hiệu ứng nền Grid đặc trưng của trang Admin */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="max-w-4xl w-full text-center space-y-8 relative z-10">
        
        {/* Số 404 phong cách Tech/Admin */}
        <div className="relative">
          <h1 className="text-[9rem] md:text-[13rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-900 leading-none select-none opacity-50">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldAlert className="w-20 h-20 md:w-28 md:h-28 text-blue-500 animate-pulse" strokeWidth={1} />
          </div>
        </div>

        {/* Thông báo lỗi */}
        <div className="space-y-4 px-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Trang không tồn tại
          </h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Đường dẫn bạn truy cập không hợp lệ hoặc bạn không có quyền quản trị tại khu vực này. 
            Vui lòng kiểm tra lại URL.
          </p>
        </div>

        {/* Các thẻ điều hướng nhanh cho Admin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 mt-12">
          <Link href="/">
            <div className="group rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <LayoutDashboard className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-lg text-white">Dashboard</h3>
                <p className="text-sm text-slate-500">Tổng quan hệ thống</p>
              </div>
            </div>
          </Link>

          <Link href="/users">
            <div className="group rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-lg text-white">Người dùng</h3>
                <p className="text-sm text-slate-500">Quản lý tài khoản</p>
              </div>
            </div>
          </Link>

          <Link href="/settings">
            <div className="group rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Settings className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-lg text-white">Cài đặt</h3>
                <p className="text-sm text-slate-500">Cấu hình hệ thống</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Nút hành động chính */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button 
            size="lg"
            onClick={() => router.back()}
            variant="outline"
            className="min-w-[160px] rounded-md border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại trang trước
          </Button>

          <Button 
            size="lg"
            asChild
            className="min-w-[160px] rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20"
          >
            <Link href="/">Về Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Hiệu ứng hạt bụi mờ */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-500 rounded-full animate-pulse opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-slate-500 rounded-full animate-pulse opacity-20" />
    </div>
  );
}
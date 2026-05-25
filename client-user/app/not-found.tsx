'use client';

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Search, ShoppingBag, Flame, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50 text-zinc-800 p-4">
      {/* Soft background glow */}
      <div className="fixed inset-0 bg-gradient-to-tr from-orange-200/40 via-transparent to-yellow-200/30 pointer-events-none" />

      <div className="max-w-4xl w-full text-center space-y-8 relative z-10">
        
        {/* 404 */}
        <div className="relative">
          <h1 className="text-[9rem] md:text-[13rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-yellow-400 leading-none select-none opacity-60">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="w-20 h-20 md:w-28 md:h-28 text-orange-500 animate-bounce" strokeWidth={1.2} />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 px-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Úi 😅 Không thấy món này rồi!
          </h2>
          <p className="text-zinc-600 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Món bạn tìm có thể đã hết hàng hoặc bị gỡ khỏi kệ.
            Quay lại xem thêm nhiều món ăn vặt ngon khác nha!
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 mt-12">
          <Link href="/">
            <div className="group rounded-xl bg-white border border-orange-100 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Home className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-semibold text-lg">Trang chủ</h3>
                <p className="text-sm text-zinc-500">Món bán chạy hôm nay</p>
              </div>
            </div>
          </Link>

          <Link href="/search">
            <div className="group rounded-xl bg-white border border-orange-100 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Search className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-semibold text-lg">Tìm kiếm</h3>
                <p className="text-sm text-zinc-500">Snack, bánh kẹo, đồ khô</p>
              </div>
            </div>
          </Link>

          <Link href="/collections/hot">
            <div className="group rounded-xl bg-white border border-orange-100 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-semibold text-lg">Món hot</h3>
                <p className="text-sm text-zinc-500">Đang được mua nhiều</p>
              </div>
            </div>
          </Link>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button 
            size="lg"
            onClick={() => router.back()}
            variant="outline"
            className="min-w-[160px] rounded-full border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          <Button 
            size="lg"
            asChild
            className="min-w-[160px] rounded-full bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-300/40"
          >
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>

      {/* Subtle dots */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-300 rounded-full animate-ping opacity-30" />
      <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-yellow-300 rounded-full animate-pulse opacity-30" />
    </div>
  );
}

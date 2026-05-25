// "use client"

// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import {
//   CircleAlert,
//   Lock,
//   Sparkles,
//   Pencil,
//   X
// } from "lucide-react"
// import { formatPrice } from "@/lib/utils"
// import { AppliedDiscount } from "@/types/discount"
// import { queryClient } from "../QueryClientProviders"
// import { useMutation } from "@tanstack/react-query"
// import { toast } from "sonner"
// import { Cart } from "@/types/cart"
// import {
//   applyAutoDiscountsToCart,
//   removeDiscountFromCart,
// } from "@/services/cart.service"
// import Link from "next/link"

// type Props = {
//   Discounts: AppliedDiscount[]
//   isAuthenticated: boolean
//   DiscountMode: "auto" | "manual"
// }

// export function DiscountPopup({
//   Discounts,
//   isAuthenticated,
//   DiscountMode,
// }: Props) {

//   const applyAutoMutation = useMutation({
//     mutationFn: applyAutoDiscountsToCart,
//     onSuccess: (data) => {
//       queryClient.setQueryData(["cart-pricing"], data)
//       queryClient.setQueryData(["user-cart"], (old: Cart) =>
//         old ? { ...old, DiscountMode: "auto" } : old
//       )
//       toast.success("Đã chuyển sang tự động chọn ưu đãi")
//     },
//     onError: () => {
//       toast.error("Không thể chuyển sang tự động")
//     },
//     onSettled: () => {
//       queryClient.invalidateQueries({ queryKey: ["cart-pricing"], exact: false })
//     },
//   })

//   const removeDiscountMutation = useMutation({
//     mutationFn: (DiscountId: string) =>
//       removeDiscountFromCart(DiscountId),
//     onSuccess: (data) => {
//       queryClient.setQueryData(["cart-pricing"], data)
//       toast.success("Đã xoá khuyến mãi")
//     },
//     onError: () => {
//       toast.error("Xoá khuyến mãi thất bại")
//     },
//     onSettled: () => {
//       queryClient.invalidateQueries({ queryKey: ["cart-pricing"], exact: false })
//     },
//   })

//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//         <CircleAlert className="h-4 w-4 text-orange-500 cursor-pointer" />
//       </DialogTrigger>

//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle>Khuyến mãi đang áp dụng</DialogTitle>
//         </DialogHeader>

//         {Discounts.length === 0 ? (
//           <p className="text-sm text-muted-foreground">
//             Chưa có khuyến mãi nào
//           </p>
//         ) : (
//           <div className="space-y-3">
//             {Discounts.map((promo) => (
//               <div
//                 key={promo._id}
//                 className="border rounded-lg p-3 space-y-1"
//               >
//                 <div className="flex items-center justify-between">
//                   <h4 className="font-medium">{promo.name}</h4>

//                   <div className="flex items-center gap-2">
//                     <Badge
//                       variant={promo.source === "auto" ? "secondary" : "default"}
//                       className="flex items-center gap-1"
//                     >
//                       {promo.source === "auto" ? (
//                         <>
//                           <Sparkles className="h-3 w-3" />
//                           Tự động
//                         </>
//                       ) : (
//                         <>
//                           <Pencil className="h-3 w-3" />
//                           Bạn chọn
//                         </>
//                       )}
//                     </Badge>

//                     {DiscountMode === "manual" && (
//                       <button
//                         onClick={() =>
//                           removeDiscountMutation.mutate(promo._id)
//                         }
//                         className="text-red-500 hover:text-red-600"
//                       >
//                         <X className="h-4 w-4" />
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 <p className="text-sm text-muted-foreground">
//                   {promo.description}
//                 </p>

//                 <p className="text-sm font-medium text-green-600">
//                   Giảm {formatPrice(promo.discountValue)}
//                 </p>
//               </div>
//             ))}
//           </div>
//         )}

//         {!isAuthenticated && Discounts.length > 0 && (
//           <div className="mt-4 flex items-center justify-between bg-muted p-3 rounded-lg">
//             <div className="flex items-center gap-2 text-sm">
//               <Lock className="h-4 w-4" />
//               <span>Đăng nhập để tự chọn khuyến mãi</span>
//             </div>
//             <Button size="sm" asChild>
//               <Link href="/login">Đăng nhập</Link>
//             </Button>
//           </div>
//         )}

//         {isAuthenticated && (
//           <div className="mt-4 flex items-center justify-between bg-muted p-3 rounded-lg">
//             <div className="text-sm">
//               {DiscountMode === "auto" ? (
//                 <span>
//                   Hệ thống đang <b>tự động chọn ưu đãi tốt nhất</b>
//                 </span>
//               ) : (
//                 <span>
//                   Bạn đang <b>tự chọn ưu đãi</b>
//                 </span>
//               )}
//             </div>

//             {DiscountMode === "auto" ? (
//               <DialogClose asChild>
//                 <Button size="sm" asChild>
//                   <Link href="/Discounts">
//                     Chỉnh sửa
//                   </Link>
//                 </Button>
//               </DialogClose>
//             ) : (
//               <Button
//                 size="sm"
//                 onClick={() => applyAutoMutation.mutate()}
//               >
//                 Tự động
//               </Button>
//             )}
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   )
// }

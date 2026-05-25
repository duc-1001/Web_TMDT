"use client"

import { useEffect, useState } from "react"
import { User, Package, Heart, MapPin, Settings, LogOut, Edit, ShoppingCart, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChangePasswordForm, changePasswordSchema, EditInfoForm, editInfoSchema } from "@/schemas/auth.schema"
import { useMutation } from "@tanstack/react-query"
import { changeUserPassword, updateUserProfile, updateUserAvatar } from "@/services/auth.service"
import { queryClient } from "@/components/QueryClientProviders"
import { toast } from "sonner"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/store/store"
import { Dialog } from "@/components/ui/dialog"
import AddNewAddress from "@/components/forms/user-address/add-new-address"
import { fetchLogout } from "@/store/slices/authSlice"
import { UserAddress } from "@/types/user_address"
import EditUserAddress from "@/components/forms/user-address/edit-user-address"
import DeleteUserAddress from "@/components/forms/user-address/delete-user-address"
import { useSearchParams } from "next/navigation"
import { uploadFile } from "@/services/upload.service"

export default function AccountPage() {
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const addAddress = searchParams.get("add-address")
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteAddressId, setDeleteAddressId] = useState("")
  const [tabValue, setTabValue] = useState("profile")
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (addAddress === "true") {
      setIsAddDialogOpen(true)
      setTabValue("addresses")
    }
  }, [addAddress])

  const handleEditAddress = (address: UserAddress) => {
    setSelectedAddress(address)
    setIsEditDialogOpen(true)
  }

  const onSubmitEditInfo = async (data: EditInfoForm) => {
    try {
      const res = await updateUserProfile({ fullName: data.fullName, phoneNumber: data.phoneNumber })
      dispatch({ type: 'auth/updateUserSuccess', payload: { user: res.data } });
      setIsEditingInfo(false)
      toast.success("Cập nhật thông tin thành công")
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    } catch (error) {
      console.error("Cập nhật thông tin thất bại:", error)
    }
  }

  const onSubmitChangePassword = async (data: ChangePasswordForm) => {
    try {
      await changeUserPassword(data.currentPassword, data.newPassword)
      setIsEditingPassword(false)
      toast.success("Đổi mật khẩu thành công")
      resetChangePassword()
    } catch (error) {
      console.error("Đổi mật khẩu thất bại:", error)
    }
  }

  const {
    setValue: setEditInfoValue,
    register: registerEditInfo,
    formState: { errors: editInfoErrors, isSubmitting: isEditInfoSubmitting },
    handleSubmit: handleSubmitEditInfo,
  } = useForm<EditInfoForm>({
    resolver: zodResolver(editInfoSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
    },
  })

  const {
    reset: resetChangePassword,
    register: registerChangePassword,
    formState: { errors: passwordErrors, isSubmitting: isChangePasswordSubmitting },
    handleSubmit: handleSubmitChangePassword,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  const addresses = user?.addresses || []

  useEffect(() => {
    if (user) {
      setEditInfoValue("fullName", user.fullName || "")
      setEditInfoValue("phoneNumber", user.phoneNumber || "")
    }
  }, [user, resetChangePassword])

  const handleLogout = () => {
    try {
      dispatch(fetchLogout())
    } catch (error) {
      console.error("Đăng xuất thất bại:", error)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if(!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một tệp hình ảnh hợp lệ")
      return
    }

    if(file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Kích thước tệp quá lớn. Vui lòng chọn hình ảnh dưới 5MB.")
      return
    }

    try {
      setIsUploadingAvatar(true)

      // Create preview
      const preview = URL.createObjectURL(file)
      setAvatarPreview(preview)

      // Upload file
      const uploadResponse = await uploadFile(file, 'user')

      if (!uploadResponse) {
        throw new Error("Failed to upload avatar")
      }
      const avatarUrl = uploadResponse.url
      // Update user profile with new avatar
      await updateUserAvatar(avatarUrl)

      // Update Redux store directly with new avatar
      if (user) {
        dispatch({ type: 'auth/updateUserSuccess', payload: { user: { ...user, avatar: avatarUrl } } });
      }

      toast.success("Cập nhật avatar thành công")
      setAvatarPreview(null)
      
      // Also invalidate query to keep cache in sync
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    } catch (error) {
      console.error("Cập nhật avatar thất bại:", error)
      toast.error("Cập nhật avatar thất bại")
      setAvatarPreview(null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative group">
                  <Avatar className="h-20 w-20 mb-3">
                    <AvatarImage src={avatarPreview || user?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-orange-600 text-orange-500-foreground text-2xl">
                      {user?.fullName ? user.fullName.charAt(0) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className={`absolute inset-0 flex items-center justify-center w-20 h-20 rounded-full bg-black/50 text-white ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} cursor-pointer transition-opacity`}>
                    {isUploadingAvatar ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-white drop-shadow-lg" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    className="hidden"
                  />
                </div>
                <h3 className="font-semibold text-lg">{user?.fullName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

              <Separator className="my-4" />

              <nav className="space-y-1">
                <Link
                  href="/account"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-600/10 text-orange-500 font-medium"
                >
                  <User className="h-4 w-4" />
                  Thông tin cá nhân
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Giỏ hàng của tôi
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Package className="h-4 w-4" />
                  Đơn hàng của tôi
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Sản phẩm yêu thích
                </Link>

                {/* <Link
                  href="/account"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  Địa chỉ
                </Link>
                <Link
                  href="/account"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Cài đặt
                </Link> */}
              </nav>

              <Separator className="my-4" />

              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
                <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
                <TabsTrigger value="addresses">Địa chỉ giao hàng</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <div>
                      <CardTitle>Thông tin cá nhân</CardTitle>
                      <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
                    </div>
                    <div>
                      <Edit onClick={() => setIsEditingInfo(true)} className="h-5 w-5 text-muted-foreground hover:text-black cursor-pointer" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form className="space-y-6" onSubmit={handleSubmitEditInfo(onSubmitEditInfo)}>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Họ và tên</Label>
                          <Input
                            id="name"
                            {...registerEditInfo("fullName")}
                            disabled={!isEditingInfo}
                          />
                          {editInfoErrors.fullName && <p className="text-xs font-medium text-red-500 mt-1">{editInfoErrors.fullName.message}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={user?.email}
                            disabled
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="phone">Số điện thoại</Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...registerEditInfo("phoneNumber")}
                            disabled={!isEditingInfo}
                          />
                          {editInfoErrors.phoneNumber && <p className="text-xs font-medium text-red-500 mt-1">{editInfoErrors.phoneNumber.message}</p>}
                        </div>
                      </div>
                      {isEditingInfo && (
                        <div className="flex justify-end gap-3">
                          <Button type="button" variant="outline" onClick={() => setIsEditingInfo(false)}>Hủy</Button>
                          <Button className="cursor-pointer" disabled={isEditInfoSubmitting}>Lưu thay đổi</Button>
                        </div>
                      )}
                    </form>

                    <Separator />

                    <form className="space-y-6" onSubmit={handleSubmitChangePassword(onSubmitChangePassword)}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold mb-3">Đổi mật khẩu</h4>
                        <Edit onClick={() => setIsEditingPassword(true)} className="h-5 w-5 text-muted-foreground hover:text-black cursor-pointer" />
                      </div>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                          <Input id="current-password" type="password" disabled={!isEditingPassword} {...registerChangePassword("currentPassword")} />
                          {passwordErrors.currentPassword && <p className="text-xs font-medium text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-password">Mật khẩu mới</Label>
                          <Input id="new-password" type="password" disabled={!isEditingPassword} {...registerChangePassword("newPassword")} />
                          {passwordErrors.newPassword && <p className="text-xs font-medium text-red-500 mt-1">{passwordErrors.newPassword.message}</p>}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                          <Input id="confirm-password" type="password" disabled={!isEditingPassword} {...registerChangePassword("confirmNewPassword")} />
                          {passwordErrors.confirmNewPassword && <p className="text-xs font-medium text-red-500 mt-1">{passwordErrors.confirmNewPassword.message}</p>}
                        </div>
                      </div>
                      {
                        isEditingPassword &&
                        <div className="flex justify-end gap-3">
                          <Button type="button" variant="outline" onClick={() => setIsEditingPassword(false)}>Hủy</Button>
                          <Button className="cursor-pointer" disabled={isChangePasswordSubmitting}>Lưu mật khẩu</Button>
                        </div>
                      }
                    </form>

                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Địa chỉ giao hàng</CardTitle>
                        <CardDescription className="mt-2">Quản lý địa chỉ nhận hàng của bạn</CardDescription>
                      </div>
                      <Button className="text-white" onClick={() => setIsAddDialogOpen(true)}>Thêm địa chỉ mới</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addresses.map((address) => (
                      <Card key={address._id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{address?.name}</h4>
                                {address.isDefault && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-600/10 text-orange-500 font-medium">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-sm">
                                {address?.receiver} | {address?.phone}
                              </p>
                              <p className="text-sm text-muted-foreground">{address?.street + ", " + address?.ward.name + ", " + address?.province.name}</p>
                            </div>
                            {
                              <div className="flex gap-2">
                                <Button onClick={() => { handleEditAddress(address) }} variant="outline" size="sm">
                                  Sửa
                                </Button>
                                {!address.isDefault && (
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => { setDeleteAddressId(address._id); setIsDeleteDialogOpen(true); }}>
                                    Xóa
                                  </Button>
                                )}
                              </div>
                            }
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <AddNewAddress setIsAddDialogOpen={setIsAddDialogOpen} />
          </Dialog>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <EditUserAddress selectedAddress={selectedAddress!} setIsEditDialogOpen={setIsEditDialogOpen} />
          </Dialog>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DeleteUserAddress setIsDeleteDialogOpen={setIsDeleteDialogOpen} deleteAddressId={deleteAddressId} />
          </Dialog>
        </div>
      </div>
    </div>
  )
}

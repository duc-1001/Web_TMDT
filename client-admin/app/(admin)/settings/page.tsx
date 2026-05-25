"use client"
import {
  Globe,
  Smartphone,
  Building2,
  Clock,
  Eye,
  AlertCircle,
} from "lucide-react"
import { useMemo } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import SystemTab from "@/components/setting/system-tab"
import ContactTab from "@/components/setting/contact-tab"
import LegalTab from "@/components/setting/lega-tab"
import LocalTab from "@/components/setting/local-tab"
import DisplayTab from "@/components/setting/display-tab"
import StatusTab from "@/components/setting/status-tab"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getSettingBySection, updateSettingBySection } from "@/services/system.service"
import { SystemSettingsPayload } from "@/types/setting"
import { ContactSettings } from "@/schemas/system.schema"
import { queryClient } from "@/components/QueryClientProviders"

export default function GeneralSettingsPage() {
  const { data: systemData } = useQuery({
    queryKey: ["settings", "system"],
    queryFn: () => getSettingBySection<SystemSettingsPayload>("system"),
  })

  const { data: contactData } = useQuery({
    queryKey: ["settings", "contact"],
    queryFn: () => getSettingBySection<ContactSettings>("contact"),
  })

  const { data: legalData } = useQuery({
    queryKey: ["settings", "legal"],
    queryFn: () => getSettingBySection<any>("legal"),
  })

  const { data: localeData } = useQuery({
    queryKey: ["settings", "locale"],
    queryFn: () => getSettingBySection<any>("locale"),
  })

  const { data: displayData } = useQuery({
    queryKey: ["settings", "display"],
    queryFn: () => getSettingBySection<any>("display"),
  })

  const {data: statusData} = useQuery({
    queryKey: ["settings", "status"],
    queryFn: () => getSettingBySection<any>("status"),
  })

  const handleUpdateSetting = async <T extends object>(
    section: string,
    data: T
  ) => {
    return await updateSettingBySection<T>(section, data).then((updated) => {
      queryClient.setQueryData(["settings", section], updated);
      return updated;
    });
  };

  const overview = useMemo(() => {
    const hasSystem = Boolean(systemData?.websiteName && systemData?.shortName)
    const hasContact = Boolean(contactData?.contactEmail && contactData?.contactPhone)
    const hasAddress = Boolean(contactData?.province?.code && contactData?.ward?.code)
    const hasLegal = Boolean(legalData?.companyName && legalData?.businessRegistrationNumber)
    const isSiteOnline = statusData?.isSiteOnline !== false

    const completed = [hasSystem, hasContact, hasAddress, hasLegal].filter(Boolean).length
    const total = 4
    const percent = Math.round((completed / total) * 100)

    return {
      completed,
      total,
      percent,
      isSiteOnline,
      contactEmail: contactData?.contactEmail || "Chưa thiết lập",
      contactPhone: contactData?.contactPhone || "Chưa thiết lập",
      workingHours: contactData?.workingHours || "Chưa thiết lập",
    }
  }, [systemData, contactData, legalData, statusData])


  return (
    <div className="w-full space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Tổng quan cấu hình</span>
            <Badge variant={overview.isSiteOnline ? "default" : "destructive"}>
              {overview.isSiteOnline ? "Website đang hoạt động" : "Website đang bảo trì"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Mức độ hoàn thiện</p>
            <p className="mt-2 text-2xl font-bold">{overview.percent}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.completed}/{overview.total} nhóm cấu hình cơ bản đã hoàn tất
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Liên hệ hỗ trợ</p>
            <p className="mt-2 font-medium">{overview.contactPhone}</p>
            <p className="text-xs text-muted-foreground mt-1">{overview.contactEmail}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Thời gian làm việc</p>
            <p className="mt-2 font-medium">{overview.workingHours}</p>
            <p className="text-xs text-muted-foreground mt-1">Dùng cho footer và trang liên hệ phía người dùng</p>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cài đặt hệ thống</CardTitle>
          <p className="text-sm text-muted-foreground">
            Quản lý toàn bộ cấu hình vận hành website: thông tin thương hiệu, liên hệ, pháp lý, hiển thị và trạng thái hệ thống.
          </p>
        </CardHeader>

        <Tabs defaultValue="system">
          <TabsList
            className="
                flex w-full
                overflow-x-auto
                gap-1
                rounded-none
                border-b
                px-1
              "
          >
            <TabsTrigger
              value="system"
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Hệ thống</span>
            </TabsTrigger>

            <TabsTrigger
              value="contact"
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <Smartphone className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Liên hệ</span>
            </TabsTrigger>

            <TabsTrigger
              value="legal"
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Pháp lý</span>
            </TabsTrigger>

            <TabsTrigger
              value="locale"
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Địa phương</span>
            </TabsTrigger>

            <TabsTrigger
              value="display"
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <Eye className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Hiển thị</span>
            </TabsTrigger>

            <TabsTrigger
              value="status"
              className="flex items-center gap-1 whitespace-nowrap"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Trạng thái</span>
            </TabsTrigger>
          </TabsList>
          {/* SYSTEM */}
          <SystemTab data={systemData} onUpdate={handleUpdateSetting} />
          {/* CONTACT */}
          <ContactTab data={contactData} onUpdate={handleUpdateSetting} />
          {/* LEGAL */}
          <LegalTab data={legalData} onUpdate={handleUpdateSetting} />
          {/* LOCALE */}
          <LocalTab data={localeData} onUpdate={handleUpdateSetting} />
          {/* DISPLAY */}
          <DisplayTab data={displayData} onUpdate={handleUpdateSetting} />
          {/* STATUS */}
          <StatusTab data={statusData} onUpdate={handleUpdateSetting} />
        </Tabs>
      </Card>
    </div>
  )
}

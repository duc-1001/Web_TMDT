"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Calendar,
} from "lucide-react";
import TrafficSource from "@/components/analytic/trafic-source";
import { useEffect, useState } from "react";
import Dashboard from "@/components/analytic/dashboard";
import RevenueChart from "@/components/analytic/chart-revenue";
import CategoryRevenueComponent from "@/components/analytic/category-revenue";
import RecentOrderComponent from "@/components/analytic/recent-order";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductReport from "@/components/analytic/product";
import Customers from "@/components/analytic/customers";

const VALID_DAYS = ["1", "7", "30", "90", "365"];
const VALID_TABS = ["overview", "products", "customers", "traffic"];

export default function ReportsPage() {

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ===== INIT STATE FROM URL =====

  const initialDay =
    VALID_DAYS.includes(searchParams.get("day") ?? "")
      ? searchParams.get("day")!
      : "7";

  const initialTab =
    VALID_TABS.includes(searchParams.get("tab") ?? "")
      ? searchParams.get("tab")!
      : "overview";

  const [day, setDay] = useState(initialDay);
  const [tab, setTab] = useState(initialTab);

  // ===== SYNC STATE -> URL =====

  useEffect(() => {

    const params = new URLSearchParams(searchParams.toString());

    let changed = false;

    if (params.get("day") !== day) {
      params.set("day", day);
      changed = true;
    }

    if (params.get("tab") !== tab) {
      params.set("tab", tab);
      changed = true;
    }

    if (changed) {
      router.replace(`${pathname}?${params.toString()}`);
    }

  }, [day, tab, pathname, router, searchParams]);

  return (
    <div className="container mx-auto space-y-6 pb-12">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Báo cáo & Thống kê
          </h1>
          <p className="text-muted-foreground">
            Tổng quan hiệu suất kinh doanh - Cập nhật thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <Select onValueChange={setDay} value={day}>

            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>

            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="1">Hôm nay</SelectItem>
              <SelectItem value="7">7 ngày</SelectItem>
              <SelectItem value="30">30 ngày</SelectItem>
              <SelectItem value="90">90 ngày</SelectItem>
              <SelectItem value="365">Năm nay</SelectItem>
            </SelectContent>

          </Select>

        </div>

      </div>

      {/* DASHBOARD CARDS */}

      <Dashboard day={parseInt(day)}/>

      {/* TABS */}

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">

        <TabsList className="w-full justify-start border-b bg-transparent rounded-none h-auto p-0 gap-6">

          <TabsTrigger value="overview" className="tab-trigger">
            Tổng quan
          </TabsTrigger>

          <TabsTrigger value="products" className="tab-trigger">
            Sản phẩm
          </TabsTrigger>

          <TabsTrigger value="customers" className="tab-trigger">
            Khách hàng
          </TabsTrigger>

          {/* <TabsTrigger value="traffic" className="tab-trigger">
            Traffic & Marketing
          </TabsTrigger> */}

        </TabsList>

        {/* OVERVIEW */}

        <TabsContent value="overview" className="space-y-6 mt-6">

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart day={parseInt(day)} tab={tab} />
            <TrafficSource day={parseInt(day)} tab={tab} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryRevenueComponent day={parseInt(day)} tab={tab} />
            <RecentOrderComponent tab={tab} />
          </div>

        </TabsContent>

        {/* PRODUCTS */}

        <TabsContent value="products" className="space-y-6 mt-6">
          <ProductReport day={parseInt(day)} tab={tab} />
        </TabsContent>

        {/* CUSTOMERS */}

        <TabsContent value="customers" className="space-y-6 mt-6">
          <Customers day={parseInt(day)} tab={tab} />
        </TabsContent>

        {/* TRAFFIC */}

        <TabsContent value="traffic" className="space-y-6 mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Hiệu suất Traffic & Marketing</CardTitle>
              <CardDescription>
                Chi tiết theo kênh (Google, Facebook, Shopee Ads, TikTok...)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Phần này sẽ hiển thị chi tiết ROAS, CPC, CTR theo từng kênh khi kết nối dữ liệu thực tế.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
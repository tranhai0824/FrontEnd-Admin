"use client";

import { CircleDollarSign, Download, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAYMENT_STATUS_LABELS } from "@/config/constants";
import { paymentsMock } from "@/data/admin-mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PaymentManagement() {
  const paidTotal = paymentsMock.filter((item) => item.status === "paid").reduce((total, item) => total + item.amount, 0);
  const pendingTotal = paymentsMock.filter((item) => item.status === "pending").reduce((total, item) => total + item.amount, 0);

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader title="Thanh toán" description="Theo dõi giao dịch, hóa đơn và doanh thu từ các gói dịch vụ đối tác." icon={CircleDollarSign} action={<Button variant="outline"><Download />Xuất đối soát</Button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <PaymentStat label="Đã thanh toán" value={formatCurrency(paidTotal)} detail={`${paymentsMock.filter((item) => item.status === "paid").length} giao dịch`} />
        <PaymentStat label="Đang xử lý" value={formatCurrency(pendingTotal)} detail="Chờ xác nhận thanh toán" />
        <PaymentStat label="Tỷ lệ thành công" value="92,4%" detail="Trong 30 ngày gần nhất" />
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Mã hóa đơn</TableHead><TableHead>Đối tác</TableHead><TableHead>Ngày tạo</TableHead><TableHead>Số tiền</TableHead><TableHead>Trạng thái</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{paymentsMock.map((item) => (
            <TableRow key={item.id}>
              <TableCell><div className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-muted-foreground" /><span className="font-mono text-xs">{item.reference}</span></div></TableCell>
              <TableCell className="font-medium">{item.partnerName}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
              <TableCell className="font-semibold">{formatCurrency(item.amount)}</TableCell>
              <TableCell><StatusBadge status={item.status} label={PAYMENT_STATUS_LABELS[item.status]} /></TableCell>
              <TableCell><Button variant="ghost" size="sm">Chi tiết</Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PaymentStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Tag, Button, Select, Space, Card, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import api from "../../api/client";
import { useAuthStore } from "../../stores/auth";

const { Title } = Typography;

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "blue",
  INSPECTING: "orange",
  PRICE_OFFER: "purple",
  APPROVED: "cyan",
  CANCELLED: "red",
  PARTS_WAITING: "gold",
  REPAIRING: "processing",
  QC: "magenta",
  READY: "green",
  DELIVERED: "success",
};

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Kabul Edildi",
  INSPECTING: "Inceleniyor",
  PRICE_OFFER: "Fiyat Teklifi",
  APPROVED: "Onaylandi",
  CANCELLED: "Iptal",
  PARTS_WAITING: "Parca Bekliyor",
  REPAIRING: "Onarimda",
  QC: "Kalite Kontrol",
  READY: "Teslime Hazir",
  DELIVERED: "Teslim Edildi",
};

export default function ServiceListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["services", page, status],
    queryFn: () =>
      api
        .get("/services", { params: { page, limit: 20, status } })
        .then((r) => r.data),
  });

  const columns = [
    {
      title: "Takip No",
      dataIndex: "trackingNumber",
      key: "trackingNumber",
      render: (text: string, record: any) => (
        <Button type="link" onClick={() => navigate(`/services/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || "default"}>
          {STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: "Musteri",
      key: "customer",
      render: (_: any, record: any) => record.customer?.fullName || "-",
    },
    {
      title: "Cihaz",
      key: "device",
      render: (_: any, record: any) =>
        record.device?.template?.name || "-",
    },
    {
      title: "Teknisyen",
      key: "technician",
      render: (_: any, record: any) => record.technician?.fullName || "-",
    },
    {
      title: "Tarih",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD.MM.YYYY HH:mm"),
    },
    {
      title: "Islem",
      key: "action",
      render: (_: any, record: any) => (
        <Button size="small" onClick={() => navigate(`/services/${record.id}`)}>
          Detay
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Servis Kayitlari
        </Title>
        {(user?.role === "ADMIN" || user?.role === "TECHNICIAN") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/services/new")}>
            Yeni Kayit
          </Button>
        )}
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="Durum filtrele"
            allowClear
            style={{ width: 200 }}
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            options={Object.entries(STATUS_LABELS).map(([key, label]) => ({
              value: key,
              label,
            }))}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data?.records || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            total: data?.total || 0,
            pageSize: 20,
            onChange: setPage,
            showTotal: (total) => `Toplam ${total} kayit`,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/services/${record.id}`),
            style: { cursor: "pointer" },
          })}
        />
      </Card>
    </div>
  );
}

import { Card, Typography, Empty, Table, Tag, Button, Space, App } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { STATUS_LABELS } from "../services/state-machine";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "blue", INSPECTING: "orange", PRICE_OFFER: "purple",
  APPROVED: "cyan", CANCELLED: "red", PARTS_WAITING: "gold",
  REPAIRING: "processing", QC: "magenta", READY: "green", DELIVERED: "success",
};

export default function CustomerDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const { data, isLoading } = useQuery({
    queryKey: ["my-services"],
    queryFn: () => api.get("/services").then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/services/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services"] });
      message.success("Teklif onaylandi");
    },
    onError: (err: any) => message.error(err?.response?.data?.error?.message || "Hata"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/services/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services"] });
      message.success("Teklif reddedildi");
    },
    onError: (err: any) => message.error(err?.response?.data?.error?.message || "Hata"),
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
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s] || s}</Tag>,
    },
    {
      title: "Cihaz",
      key: "device",
      render: (_: any, r: any) => r.device?.template?.name || "-",
    },
    {
      title: "Ariza",
      dataIndex: "faultDescription",
      key: "faultDescription",
    },
    {
      title: "Tahmini Ucret",
      dataIndex: "estimatedCost",
      key: "estimatedCost",
      render: (v: number) => v ? `${v} TL` : "-",
    },
    {
      title: "Tarih",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) => dayjs(d).format("DD.MM.YYYY"),
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          {record.status === "PRICE_OFFER" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={(e) => { e.stopPropagation(); approveMutation.mutate(record.id); }}
                loading={approveMutation.isPending}
              >
                Onayla
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(record.id); }}
                loading={rejectMutation.isPending}
              >
                Reddet
              </Button>
            </>
          )}
          <Button size="small" onClick={() => navigate(`/services/${record.id}`)}>
            Detay
          </Button>
        </Space>
      ),
    },
  ];

  const hasPendingQuote = data?.records?.some((r: any) => r.status === "PRICE_OFFER");

  return (
    <div>
      <Title level={3}>Cihazlarim ve Servis Kayitlari</Title>

      {hasPendingQuote && (
        <Card style={{ marginBottom: 16, background: "#fff7e6", border: "1px solid #faad14" }}>
          <Text strong style={{ color: "#faad14" }}>
            Bekleyen fiyat teklifleriniz var. Lutfen onaylayin veya reddedin.
          </Text>
        </Card>
      )}

      {isLoading ? (
        <Card loading />
      ) : data?.records?.length ? (
        <Table
          columns={columns}
          dataSource={data.records}
          rowKey="id"
          pagination={false}
          onRow={(record) => ({
            onClick: () => navigate(`/services/${record.id}`),
            style: { cursor: "pointer" },
          })}
        />
      ) : (
        <Empty description="Henuz servis kaydiniz bulunmamaktadir" />
      )}
    </div>
  );
}

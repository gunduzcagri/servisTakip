import { useState } from "react";
import { Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, Typography, Popconfirm, Steps } from "antd";
import { PlusOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { App } from "antd";

const { Title } = Typography;

export default function CargoPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [form] = Form.useForm();
  const [trackingForm] = Form.useForm();

  const { data: companies } = useQuery({
    queryKey: ["cargo-companies"],
    queryFn: () => api.get("/cargo/companies").then((r) => r.data),
  });

  const { data: shipments, isLoading } = useQuery({
    queryKey: ["cargo-shipments"],
    queryFn: () => api.get("/cargo/shipments", { params: { limit: 20 } }).then((r) => r.data),
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (values: any) => {
      return api.post("/cargo/shipments", values);
    },
    onSuccess: () => {
      message.success("Kargo gondersi olusturuldu");
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["cargo-shipments"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const deleteShipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/cargo/shipments/${id}`);
    },
    onSuccess: () => {
      message.success("Kargo gondersi silindi");
      queryClient.invalidateQueries({ queryKey: ["cargo-shipments"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.put(`/cargo/shipments/${id}/status`, { status });
    },
    onSuccess: () => {
      message.success("Kargo durumu guncellendi");
      queryClient.invalidateQueries({ queryKey: ["cargo-shipments"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const trackMutation = useMutation({
    mutationFn: async (values: any) => {
      return api.post("/cargo/track", values);
    },
    onSuccess: (res) => {
      message.success("Takip bilgileri alindi");
      setSelectedShipment(res.data);
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const handleCreate = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleCopyTracking = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    message.success("Takip numarasi kopyalandi");
  };

  const statusColors: Record<string, string> = {
    CREATED: "gray",
    PICKED_UP: "blue",
    IN_TRANSIT: "processing",
    AT_DESTINATION: "orange",
    DELIVERED: "green",
    RETURNED: "red",
    FAILED: "red",
  };

  const statusLabels: Record<string, string> = {
    CREATED: "Olusturuldu",
    PICKED_UP: "Tesim Alindi",
    IN_TRANSIT: "Tasimada",
    AT_DESTINATION: "Varis",
    DELIVERED: "Teslim Edildi",
    RETURNED: "Iade",
    FAILED: "Basarisiz",
  };

  const columns = [
    {
      title: "Takip No",
      dataIndex: "trackingNumber",
      key: "trackingNumber",
      width: 180,
      render: (val: string) => (
        <Space>
          <Typography.Text copyable={{ text: val }}>{val}</Typography.Text>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyTracking(val)}
          />
        </Space>
      ),
    },
    {
      title: "Firma",
      dataIndex: "company",
      key: "company",
      width: 120,
      render: (val: string) => {
        const colors: Record<string, string> = {
          ARAS: "red",
          YURTICI: "purple",
          MNG: "yellow",
          PTT: "blue",
          SURAT: "green",
        };
        return <Tag color={colors[val] || "default"}>{val}</Tag>;
      },
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (val: string) => (
        <Tag color={statusColors[val] || "default"}>
          {statusLabels[val] || val}
        </Tag>
      ),
    },
    {
      title: "Alici",
      dataIndex: "recipientName",
      key: "recipientName",
      width: 150,
    },
    {
      title: "Sehir",
      dataIndex: "recipientCity",
      key: "recipientCity",
      width: 100,
    },
    {
      title: "Kargo Kodu",
      dataIndex: "cargoCode",
      key: "cargoCode",
      width: 150,
      render: (val: string) => val || "-",
    },
    {
      title: "Tarih",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (val: string) => new Date(val).toLocaleDateString("tr-TR"),
    },
    {
      title: "Aksiyonlar",
      key: "actions",
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Select
            size="small"
            value={record.status}
            onChange={(val) => updateStatusMutation.mutate({ id: record.id, status: val })}
            style={{ width: 120 }}
          >
            {Object.entries(statusLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
            ))}
          </Select>
          <Popconfirm
            title="Silmek istediginize emin misiniz?"
            onConfirm={() => deleteShipmentMutation.mutate(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const companyOptions = companies?.companies?.map((c: any) => ({
    value: c.key,
    label: c.label,
  })) || [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={3}>Kargo Takip</Title>
        <Space>
          <Button onClick={() => setTrackingModalOpen(true)}>
            Takip Yap
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Yeni Gonderi
          </Button>
        </Space>
      </div>

      <Card title="Kargo Gonderileri">
        <Table
          columns={columns}
          dataSource={shipments?.shipments}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: shipments?.page,
            pageSize: shipments?.limit,
            total: shipments?.total,
            showTotal: (total) => `Toplam ${total}`,
          }}
        />
      </Card>

      <Modal
        title="Yeni Kargo Gondersi"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createShipmentMutation.mutate(values)}
        >
          <Title level={5}>Gonderi Bilgileri</Title>
          <Form.Item name="company" label="Kargo Firmasi" rules={[{ required: true }]}>
            <Select placeholder="Seciniz" options={companyOptions} />
          </Form.Item>
          <Form.Item name="serviceRecordId" label="Servis Kayit No (Opsiyonel)">
            <Input placeholder="SRV-xxxxx" />
          </Form.Item>

          <Title level={5}>Gonderici Bilgileri</Title>
          <Form.Item name="senderName" label="Ad Soyad / Firma">
            <Input placeholder="Varsayilan kullanilacaksa bos birakin" />
          </Form.Item>
          <Form.Item name="senderPhone" label="Telefon">
            <Input placeholder="0xxx xxx xx xx" />
          </Form.Item>
          <Form.Item name="senderAddress" label="Adres">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="senderCity" label="Sehir">
            <Input placeholder="Istanbul" />
          </Form.Item>

          <Title level={5}>Alici Bilgileri</Title>
          <Form.Item name="recipientName" label="Ad Soyad" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="recipientPhone" label="Telefon" rules={[{ required: true }]}>
            <Input placeholder="0xxx xxx xx xx" />
          </Form.Item>
          <Form.Item name="recipientAddress" label="Adres" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="recipientCity" label="Sehir" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Title level={5}>Paket Bilgileri</Title>
          <Form.Item name="packageCount" label="Paket Sayisi" initialValue={1}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="weight" label="Agirlik (kg)">
            <InputNumber min={0} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="dimensions" label="Olculer (En x Boy x Yukseklik)">
            <Input placeholder="30x40x50" />
          </Form.Item>
          <Form.Item name="notes" label="Notlar">
            <Input.TextArea />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createShipmentMutation.isPending} block>
              Olustur
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Kargo Takip"
        open={trackingModalOpen}
        onCancel={() => setTrackingModalOpen(false)}
        footer={null}
      >
        <Form
          form={trackingForm}
          layout="vertical"
          onFinish={(values) => trackMutation.mutate(values)}
        >
          <Form.Item name="company" label="Kargo Firmasi" rules={[{ required: true }]}>
            <Select options={companyOptions} />
          </Form.Item>
          <Form.Item name="trackingNumber" label="Takip Numarasi" rules={[{ required: true }]}>
            <Input placeholder="XXXXXXX" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={trackMutation.isPending} block>
              Sorgula
            </Button>
          </Form.Item>
        </Form>

        {selectedShipment && (
          <div style={{ marginTop: 20 }}>
            <Title level={5}>Takip Durumu: {selectedShipment.status}</Title>
            {selectedShipment.history && selectedShipment.history.length > 0 && (
              <Steps
                current={-1}
                direction="vertical"
                items={selectedShipment.history.map((h: any) => ({
                  title: h.status || h.description,
                  description: h.date ? new Date(h.date).toLocaleString("tr-TR") : undefined,
                }))}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState } from "react";
import { Table, Tag, Button, Modal, Form, Input, InputNumber, Space, Typography, App } from "antd";
import { PlusOutlined, EditOutlined, WarningOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";

const { Title, Text } = Typography;

export default function PartsPage() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [form] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["parts", page, search],
    queryFn: () =>
      api
        .get("/parts", { params: { page, limit: 20, search: search || undefined } })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post("/parts", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setModalOpen(false);
      form.resetFields();
      message.success("Parca olusturuldu");
    },
    onError: (err: any) => message.error(err?.response?.data?.error?.message || "Hata"),
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/parts/${editingPart?.id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setModalOpen(false);
      setEditingPart(null);
      form.resetFields();
      message.success("Parca guncellendi");
    },
    onError: (err: any) => message.error(err?.response?.data?.error?.message || "Hata"),
  });

  const stockMutation = useMutation({
    mutationFn: (values: any) =>
      api.post(`/parts/${editingPart?.id}/stock`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setStockModalOpen(false);
      setEditingPart(null);
      stockForm.resetFields();
      message.success("Stok guncellendi");
    },
    onError: (err: any) => message.error(err?.response?.data?.error?.message || "Hata"),
  });

  const openCreate = () => {
    setEditingPart(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (part: any) => {
    setEditingPart(part);
    form.setFieldsValue({
      name: part.name,
      sku: part.sku,
      description: part.description,
      unitPrice: part.unitPrice,
      criticalThreshold: part.criticalThreshold,
    });
    setModalOpen(true);
  };

  const openStockAdjust = (part: any) => {
    setEditingPart(part);
    stockForm.resetFields();
    setStockModalOpen(true);
  };

  const columns = [
    { title: "SKU", dataIndex: "sku", key: "sku", width: 140 },
    { title: "Parca Adi", dataIndex: "name", key: "name" },
    {
      title: "Birim Fiyat",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (v: number) => `${v} TL`,
    },
    {
      title: "Stok",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
      render: (qty: number, record: any) => (
        <Space>
          <Tag color={qty <= record.criticalThreshold ? "red" : "green"}>{qty}</Tag>
          {qty <= record.criticalThreshold && <WarningOutlined style={{ color: "#ff4d4f" }} />}
        </Space>
      ),
    },
    {
      title: "Kritik Esik",
      dataIndex: "criticalThreshold",
      key: "criticalThreshold",
    },
    {
      title: "",
      key: "actions",
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => openStockAdjust(record)}>Stok</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Duzenle
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Parca Stok Yonetimi</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Yeni Parca
        </Button>
      </div>

      <Input.Search
        placeholder="SKU veya parca adi ile ara..."
        allowClear
        style={{ width: 300, marginBottom: 16 }}
        onSearch={(v) => { setSearch(v); setPage(1); }}
      />

      {data?.lowStockCount > 0 && (
        <Tag color="red" style={{ marginBottom: 16, padding: "4px 12px" }}>
          {data.lowStockCount} parca kritik stok seviyesinde
        </Tag>
      )}

      <Table
        columns={columns}
        dataSource={data?.parts || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total || 0,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `Toplam ${t} parca`,
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingPart ? "Parca Duzenle" : "Yeni Parca"}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingPart(null); form.resetFields(); }}
        onOk={() => {
          form.validateFields().then((v) => {
            if (editingPart) updateMutation.mutate(v);
            else createMutation.mutate(v);
          });
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Parca Adi" rules={[{ required: true }]}>
            <Input placeholder="Orn: iPhone 15 Pro OLED Ekran" />
          </Form.Item>
          <Form.Item name="sku" label="SKU Kodu" rules={[{ required: true }]}>
            <Input placeholder="Orn: APL-15P-OLED" disabled={!!editingPart} />
          </Form.Item>
          <Form.Item name="description" label="Aciklama">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="unitPrice" label="Birim Fiyat (TL)" rules={[{ required: true, type: "number", min: 0 }]}>
            <InputNumber style={{ width: "100%" }} min={0} precision={2} />
          </Form.Item>
          {!editingPart && (
            <Form.Item name="stockQuantity" label="Baslangic Stok" initialValue={0}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          )}
          <Form.Item name="criticalThreshold" label="Kritik Stok Esigi" initialValue={5}>
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal
        title="Stok Ayarla"
        open={stockModalOpen}
        onCancel={() => { setStockModalOpen(false); setEditingPart(null); }}
        onOk={() => {
          stockForm.validateFields().then((v) => stockMutation.mutate(v));
        }}
        confirmLoading={stockMutation.isPending}
      >
        {editingPart && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>{editingPart.name}</Text>
            <br />
            <Text>Mevcut Stok: {editingPart.stockQuantity}</Text>
          </div>
        )}
        <Form form={stockForm} layout="vertical">
          <Form.Item name="quantity" label="Miktar Degisimi (+/-)" rules={[{ required: true, type: "number" }]}>
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Pozitif: stok ekle, Negatif: stok dus"
            />
          </Form.Item>
          <Form.Item name="reason" label="Sebep">
            <Input.TextArea rows={2} placeholder="Orn: Tedarikciden gelen siparis" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

import { useState } from "react";
import { Card, Table, Button, Space, Tag, Input, Modal, Form, Typography, Alert } from "antd";
import { PlusOutlined, EditOutlined, SwapOutlined, WarningOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { App } from "antd";

const { Title } = Typography;

interface Part {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  criticalThreshold: number;
  minStockLevel: number;
  unitPrice: number;
  location?: string;
  supplier?: { name: string };
}

export default function StockPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [form] = Form.useForm();
  const [adjustForm] = Form.useForm();

  const { data: stockData, isLoading } = useQuery({
    queryKey: ["stock", search],
    queryFn: () => api.get("/stock/parts", { params: { search: search || undefined } }).then((r) => r.data),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ["stock-low"],
    queryFn: () => api.get("/stock/parts/low").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return api.post("/stock/parts", values);
    },
    onSuccess: () => {
      message.success("Parca olusturuldu");
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/stock/parts/${id}`, data);
    },
    onSuccess: () => {
      message.success("Parca guncellendi");
      setModalOpen(false);
      setEditingPart(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.post(`/stock/parts/${id}/adjust`, data);
    },
    onSuccess: () => {
      message.success("Stok guncellendi");
      setAdjustModalOpen(false);
      setSelectedPart(null);
      adjustForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const handleCreate = () => {
    setEditingPart(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    form.setFieldsValue(part);
    setModalOpen(true);
  };

  const handleAdjust = (part: Part) => {
    setSelectedPart(part);
    adjustForm.resetFields();
    adjustForm.setFieldsValue({ quantity: 0, type: "IN" });
    setAdjustModalOpen(true);
  };

  const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 120,
    },
    {
      title: "Ad",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Konum",
      dataIndex: "location",
      key: "location",
      width: 100,
    },
    {
      title: "Fiyat",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 100,
      render: (val: number) => `${val.toFixed(2)} TL`,
    },
    {
      title: "Stok",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
      width: 100,
      render: (_: number, record: Part) => (
        <Tag color={record.stockQuantity <= record.criticalThreshold ? "red" : record.stockQuantity <= record.minStockLevel ? "orange" : "green"}>
          {record.stockQuantity}
        </Tag>
      ),
    },
    {
      title: "Kritik/Min",
      key: "thresholds",
      width: 100,
      render: (_: any, record: Part) => `${record.criticalThreshold}/${record.minStockLevel}`,
    },
    {
      title: "Tedarikci",
      dataIndex: ["supplier", "name"],
      key: "supplier",
      width: 150,
    },
    {
      title: "Aksiyonlar",
      key: "actions",
      width: 180,
      render: (_: any, record: Part) => (
        <Space>
          <Button size="small" icon={<SwapOutlined />} onClick={() => handleAdjust(record)}>
            Stok
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Duzenle
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={3}>Stok Yönetimi</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Yeni Parca
        </Button>
      </div>

      {lowStockData?.parts?.length > 0 && (
        <Alert
          message={`${lowStockData.parts.length} parca kritik stok seviyesinin altinda`}
          type="warning"
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          closable
          action={
            <Button size="small" type="primary" ghost>
              Goruntu le
            </Button>
          }
        />
      )}

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Ara (ad, SKU, konum)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </Space>

        <Table
          columns={columns}
          dataSource={stockData?.parts}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: stockData?.page,
            pageSize: stockData?.limit,
            total: stockData?.total,
            showTotal: (total) => `Toplam ${total}`,
          }}
        />
      </Card>

      <Modal
        title={editingPart ? "Parca Duzenle" : "Yeni Parca"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (editingPart) {
              updateMutation.mutate({ id: editingPart.id, data: values });
            } else {
              createMutation.mutate(values);
            }
          }}
        >
          <Form.Item name="name" label="Ad" rules={[{ required: true, message: "Ad gerekli" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[{ required: true, message: "SKU gerekli" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Aciklama">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="unitPrice" label="Birim Fiyat (TL)" rules={[{ required: true }]}>
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="stockQuantity" label="Baslangic Stok" initialValue={0}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="criticalThreshold" label="Kritik Esik" initialValue={5}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="minStockLevel" label="Min Stok Seviyesi" initialValue={10}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="location" label="Konum (Raf)">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} block>
              {editingPart ? "Guncelle" : "Olustur"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Stok Ayarlama"
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        footer={null}
      >
        {selectedPart && (
          <>
            <p>Mevcut stok: <strong>{selectedPart.stockQuantity}</strong></p>
            <Form
              form={adjustForm}
              layout="vertical"
              onFinish={(values) => {
                adjustMutation.mutate({ id: selectedPart.id, data: values });
              }}
            >
              <Form.Item name="type" label="Islem Tipi" rules={[{ required: true }]}>
                <Input.Group compact>
                  <Form.Item name="type" noStyle>
                    <select style={{ width: "100%" }}>
                      <option value="IN">Giris (IN)</option>
                      <option value="OUT">Cikis (OUT)</option>
                      <option value="ADJUSTMENT">Duzenleme (ADJUSTMENT)</option>
                      <option value="RETURN">Iade (RETURN)</option>
                    </select>
                  </Form.Item>
                </Input.Group>
              </Form.Item>
              <Form.Item name="quantity" label="Miktar" rules={[{ required: true, type: "number" }]}>
                <Input type="number" />
              </Form.Item>
              <Form.Item name="reason" label="Sebep">
                <Input.TextArea />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={adjustMutation.isPending} block>
                  Ayarla
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}

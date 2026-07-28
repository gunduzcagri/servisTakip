import { useState } from "react";
import { Card, Table, Button, Modal, Form, Input, Select, Space, Typography, App, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";

const { Title, Text } = Typography;

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.get("/templates").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/templates", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setModalOpen(false);
      setFields([]);
      form.resetFields();
      message.success("Sablon olusturuldu");
    },
    onError: (err: any) => message.error(err?.response?.data?.error?.message || "Hata"),
  });

  const addField = () => {
    setFields([...fields, { key: `field_${Date.now()}`, label: "", type: "text", options: [] }]);
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, prop: string, value: any) => {
    const updated = [...fields];
    updated[idx] = { ...updated[idx], [prop]: value };
    setFields(updated);
  };

  const addOption = (fieldIdx: number) => {
    const updated = [...fields];
    const options = [...(updated[fieldIdx].options || []), ""];
    updated[fieldIdx] = { ...updated[fieldIdx], options };
    setFields(updated);
  };

  const updateOption = (fieldIdx: number, optIdx: number, value: string) => {
    const updated = [...fields];
    const options = [...updated[fieldIdx].options];
    options[optIdx] = value;
    updated[fieldIdx] = { ...updated[fieldIdx], options };
    setFields(updated);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      createMutation.mutate({ name: values.name, fields });
    });
  };

  const columns = [
    { title: "Sablon Adi", dataIndex: "name", key: "name" },
    {
      title: "Sistem",
      dataIndex: "isSystem",
      key: "isSystem",
      render: (v: boolean) => v ? <Tag color="blue">Sistem</Tag> : <Tag>Ozel</Tag>,
    },
    {
      title: "Alan Sayisi",
      key: "fieldCount",
      render: (_: any, r: any) => (r.fields as any[])?.length || 0,
    },
    {
      title: "Alanlar",
      key: "fields",
      render: (_: any, r: any) =>
        (r.fields as any[])?.map((f: any) => f.label).filter(Boolean).join(", ") || "-",
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Sektor Sablonlari</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Yeni Sablon
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data || []}
        rowKey="id"
        loading={isLoading}
        expandable={{
          expandedRowRender: (record: any) => (
            <div style={{ padding: 16 }}>
              {record.fields?.map((f: any, i: number) => (
                <Card key={i} size="small" style={{ marginBottom: 8 }}>
                  <Text strong>{f.label}</Text>
                  <Tag style={{ marginLeft: 8 }}>{f.type}</Tag>
                  {f.type === "select" && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      Secenekler: {(f.options as string[])?.join(", ")}
                    </Text>
                  )}
                </Card>
              ))}
            </div>
          ),
        }}
      />

      <Modal
        title="Yeni Sektor Sablonu"
        open={modalOpen}
        width={700}
        onCancel={() => { setModalOpen(false); setFields([]); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Sablon Adi" rules={[{ required: true }]}>
            <Input placeholder="Orn: Beyaz Esya Servisi" />
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 8 }}>
            <Text strong>Dinamik Alanlar</Text>
            <Button size="small" onClick={addField}>Alan Ekle</Button>
          </Space>

          {fields.map((field, idx) => (
            <Card key={idx} size="small" style={{ marginBottom: 8 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Input
                  placeholder="Alan etiketi (orn: Marka)"
                  value={field.label}
                  onChange={(e) => updateField(idx, "label", e.target.value)}
                />
                <Select
                  value={field.type}
                  onChange={(v) => updateField(idx, "type", v)}
                  style={{ width: 160 }}
                  options={[
                    { value: "text", label: "Metin" },
                    { value: "select", label: "Secim Listesi" },
                    { value: "number", label: "Sayi" },
                    { value: "password", label: "Sifre" },
                  ]}
                />
                {field.type === "select" && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Secenekler:</Text>
                    {(field.options || []).map((opt: string, oi: number) => (
                      <Input
                        key={oi}
                        size="small"
                        style={{ marginTop: 4 }}
                        placeholder={`Secenek ${oi + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(idx, oi, e.target.value)}
                      />
                    ))}
                    <Button size="small" type="link" onClick={() => addOption(idx)}>
                      + Secenek Ekle
                    </Button>
                  </div>
                )}
                <Button size="small" danger onClick={() => removeField(idx)}>
                  Kaldir
                </Button>
              </Space>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}

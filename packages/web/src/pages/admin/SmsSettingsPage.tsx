import { useState } from "react";
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Switch, Typography, Row, Col, Statistic } from "antd";
import { PlusOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, MessageOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { App } from "antd";

const { Title } = Typography;
const { TextArea } = Input;

export default function SmsSettingsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [sendForm] = Form.useForm();

  const { data: providers, isLoading } = useQuery({
    queryKey: ["sms-providers"],
    queryFn: () => api.get("/sms/providers").then((r) => r.data),
  });

  const { data: smsStats } = useQuery({
    queryKey: ["sms-stats"],
    queryFn: () => api.get("/sms/stats").then((r) => r.data),
  });

  const { data: smsLogs } = useQuery({
    queryKey: ["sms-logs"],
    queryFn: () => api.get("/sms/logs", { params: { limit: 10 } }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return api.post("/sms/providers", values);
    },
    onSuccess: () => {
      message.success("SMS saglayici eklendi");
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["sms-providers"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/sms/providers/${id}`, data);
    },
    onSuccess: () => {
      message.success("SMS saglayici guncellendi");
      setModalOpen(false);
      setEditingProvider(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["sms-providers"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/sms/providers/${id}/set-active`);
    },
    onSuccess: () => {
      message.success("Aktif saglayici degistirildi");
      queryClient.invalidateQueries({ queryKey: ["sms-providers"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/sms/providers/${id}`);
    },
    onSuccess: () => {
      message.success("SMS saglayici silindi");
      queryClient.invalidateQueries({ queryKey: ["sms-providers"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (values: any) => {
      return api.post("/sms/send", values);
    },
    onSuccess: (res) => {
      if (res.data.success) {
        message.success("SMS gonderildi");
      } else {
        message.error(`SMS gonderilemedi: ${res.data.error}`);
      }
      setSendModalOpen(false);
      sendForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["sms-logs"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const handleCreate = () => {
    setEditingProvider(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (provider: any) => {
    setEditingProvider(provider);
    form.setFieldsValue({
      ...provider,
      config: provider.config,
    });
    setModalOpen(true);
  };

  const providerColumns = [
    {
      title: "Ad",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Tip",
      dataIndex: "provider",
      key: "provider",
      render: (val: string) => {
        const colors: Record<string, string> = { NETGSM: "blue", TWILIO: "green", BULKSMS: "purple" };
        return <Tag color={colors[val] || "default"}>{val}</Tag>;
      },
    },
    {
      title: "Aktif",
      dataIndex: "isActive",
      key: "isActive",
      render: (val: boolean) => (val ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : <CloseCircleOutlined style={{ color: "#d9d9d9" }} />),
    },
    {
      title: "Guncelleme",
      key: "updatedAt",
      dataIndex: "updatedAt",
      render: (val: string) => new Date(val).toLocaleString("tr-TR"),
    },
    {
      title: "Aksiyonlar",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          {!record.isActive && (
            <Button size="small" type="primary" onClick={() => setActiveMutation.mutate(record.id)}>
              Aktif Yap
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Duzenle
          </Button>
          <Button size="small" danger onClick={() => deleteMutation.mutate(record.id)}>
            Sil
          </Button>
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: "Alici",
      dataIndex: "recipient",
      key: "recipient",
      width: 150,
    },
    {
      title: "Mesaj",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (val: string) => {
        const colors: Record<string, string> = { SENT: "green", FAILED: "red", PENDING: "orange" };
        return <Tag color={colors[val] || "default"}>{val}</Tag>;
      },
    },
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
      width: 100,
    },
    {
      title: "Tarih",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (val: string) => new Date(val).toLocaleString("tr-TR"),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={3}>SMS Gateway Ayarlari</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Yeni Provider
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Toplam SMS" value={smsStats?.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Gonderilen" value={smsStats?.sent || 0} valueStyle={{ color: "#3f8600" }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Basarisiz" value={smsStats?.failed || 0} valueStyle={{ color: "#cf1322" }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Basari Orani" value={`${smsStats?.successRate || 0}%`} />
          </Card>
        </Col>
      </Row>

      <Card title="SMS Saglayicilari" style={{ marginBottom: 16 }}>
        <Table
          columns={providerColumns}
          dataSource={providers?.providers}
          loading={isLoading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Card title="Test SMS Gonder">
        <Button type="primary" icon={<MessageOutlined />} onClick={() => setSendModalOpen(true)}>
          Test SMS
        </Button>
      </Card>

      <Card title="Son SMS Loglari" style={{ marginTop: 16 }}>
        <Table
          columns={logColumns}
          dataSource={smsLogs?.logs}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={editingProvider ? "Provider Duzenle" : "Yeni SMS Provider"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (editingProvider) {
              updateMutation.mutate({ id: editingProvider.id, data: values });
            } else {
              createMutation.mutate(values);
            }
          }}
        >
          <Form.Item name="name" label="Gosterim Adi" rules={[{ required: true }]}>
            <Input placeholder="e.g. NetGSM Ana Hesap" />
          </Form.Item>
          <Form.Item name="provider" label="Provider Tipi" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="NETGSM">NetGSM (Turkiye)</Select.Option>
              <Select.Option value="TWILIO">Twilio (International)</Select.Option>
              <Select.Option value="BULKSMS">BulkSMS (International)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="Aktif" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Typography.Title level={5}>Provider Ayarlari</Typography.Title>
          <Form.Item name={["config", "usercode"]} label="NetGSM User Code" initialValue="">
            <Input placeholder="NetGSM icin" />
          </Form.Item>
          <Form.Item name={["config", "password"]} label="NetGSM Password" initialValue="">
            <Input.Password placeholder="NetGSM icin" />
          </Form.Item>
          <Form.Item name={["config", "sender"]} label="Gonderici Adi" initialValue="ServisNet">
            <Input placeholder="Max 11 karakter" maxLength={11} />
          </Form.Item>

          <Form.Item name={["config", "accountSid"]} label="Twilio Account SID" initialValue="">
            <Input placeholder="Twilio icin" />
          </Form.Item>
          <Form.Item name={["config", "authToken"]} label="Twilio Auth Token" initialValue="">
            <Input.Password placeholder="Twilio icin" />
          </Form.Item>
          <Form.Item name={["config", "fromNumber"]} label="Twilio From Number" initialValue="">
            <Input placeholder="+1234567890" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} block>
              {editingProvider ? "Guncelle" : "Olustur"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Test SMS Gonder"
        open={sendModalOpen}
        onCancel={() => setSendModalOpen(false)}
        footer={null}
      >
        <Form
          form={sendForm}
          layout="vertical"
          onFinish={(values) => {
            sendSmsMutation.mutate(values);
          }}
        >
          <Form.Item name="recipient" label="Telefon Numarasi" rules={[{ required: true }]}>
            <Input placeholder="+905551234567" />
          </Form.Item>
          <Form.Item name="message" label="Mesaj" rules={[{ required: true }]}>
            <TextArea rows={4} maxLength={918} showCount />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={sendSmsMutation.isPending} block>
              Gonder
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Select, Button, Typography, App, Alert } from "antd";
import { ArrowLeftOutlined, WifiOutlined } from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../../api/client";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { addToQueue } from "../../utils/offlineQueue";

const { Title } = Typography;

export default function CreateServicePage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const { isOnline } = useOnlineStatus();

  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.get("/templates").then((r) => r.data),
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () =>
      api
        .get("/admin/users", { params: { role: "CUSTOMER", limit: 100 } })
        .then((r) => r.data),
  });

  const { data: technicians } = useQuery({
    queryKey: ["technicians"],
    queryFn: () =>
      api
        .get("/admin/users", { params: { role: "TECHNICIAN", limit: 100 } })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const dynamicFields: Record<string, string> = {};
      if (selectedTemplate?.fields) {
        for (const field of selectedTemplate.fields) {
          const val = values[`field_${field.key}`];
          if (val) dynamicFields[field.label] = val;
        }
      }

      const payload = {
        customerId: values.customerId,
        templateId: values.templateId,
        dynamicFields,
      };

      if (isOnline) {
        const deviceRes = await api.post("/devices", payload);

        return await api.post("/services", {
          customerId: values.customerId,
          deviceId: deviceRes.data.id,
          technicianId: values.technicianId || undefined,
          faultDescription: values.faultDescription || undefined,
        });
      } else {
        const action = addToQueue({
          type: "CREATE_SERVICE",
          url: "/api/services",
          method: "POST",
          body: { ...payload, technicianId: values.technicianId, faultDescription: values.faultDescription },
        });
        return { offline: true, id: action.id, trackingNumber: `OFFLINE-${action.id.slice(-6)}` } as any;
      }
    },
    onSuccess: (res: any) => {
      if (res.offline) {
        message.success(`Kayit yerel olarak kaydedildi. ID: ${res.trackingNumber}. Internet baglandiginda otomatik gonderilecek.`);
      } else {
        message.success(`Servis kaydi olusturuldu: ${res.data.trackingNumber}`);
      }
      navigate("/services");
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const handleTemplateChange = (templateId: string) => {
    const template = templates?.find((t: any) => t.id === templateId);
    setSelectedTemplate(template);
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/services")}
        style={{ marginBottom: 16 }}
      >
        Geri
      </Button>

      <Title level={3}>Yeni Servis Kaydi</Title>

      {!isOnline && (
        <Alert
          message="Çevrimdışı Mod"
          description="Verileriniz cihazda saklanacak ve internet bağlandığında otomatik olarak senkronize edilecektir."
          type="warning"
          icon={<WifiOutlined />}
          style={{ marginBottom: 16 }}
          showIcon
          closable
        />
      )}

      <Card style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item
            name="customerId"
            label="Musteri"
            rules={[{ required: true, message: "Musteri seciniz" }]}
          >
            <Select
              showSearch
              placeholder="Musteri seciniz"
              optionFilterProp="label"
              options={customers?.users?.map((u: any) => ({
                value: u.id,
                label: `${u.fullName} (${u.phone || u.email})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="templateId"
            label="Sektor / Cihaz Turu"
            rules={[{ required: true, message: "Sektor seciniz" }]}
          >
            <Select
              placeholder="Sektor seciniz"
              onChange={handleTemplateChange}
              options={templates?.map((t: any) => ({
                value: t.id,
                label: t.name,
              }))}
            />
          </Form.Item>

          {selectedTemplate?.fields?.map((field: any) => (
            <Form.Item
              key={field.key}
              name={`field_${field.key}`}
              label={field.label}
              rules={
                field.required ? [{ required: true, message: `${field.label} gerekli` }] : []
              }
            >
              {field.type === "select" ? (
                <Select
                  placeholder={field.placeholder || `Seciniz`}
                  options={field.options?.map((o: string) => ({ value: o, label: o }))}
                />
              ) : field.type === "password" ? (
                <Input.Password placeholder={field.placeholder} />
              ) : (
                <Input placeholder={field.placeholder} />
              )}
            </Form.Item>
          ))}

          <Form.Item name="technicianId" label="Teknisyen">
            <Select
              showSearch
              allowClear
              placeholder="Teknisyen seciniz (opsiyonel)"
              optionFilterProp="label"
              options={technicians?.users?.map((u: any) => ({
                value: u.id,
                label: u.fullName,
              }))}
            />
          </Form.Item>

          <Form.Item name="faultDescription" label="Ariza Aciklamasi">
            <Input.TextArea rows={3} placeholder="Musterinin belirttigi ariza..." />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
              block
              size="large"
              icon={!isOnline ? <WifiOutlined /> : undefined}
            >
              {!isOnline ? "Çevrimdışı Kaydet" : "Servis Kaydi Olustur"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

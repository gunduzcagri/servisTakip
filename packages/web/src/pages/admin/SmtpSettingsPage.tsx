import { useEffect } from "react";
import { Card, Form, Input, InputNumber, Switch, Button, Typography, App, Divider } from "antd";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../../api/client";

const { Title } = Typography;

export default function SmtpSettingsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["smtp-settings"],
    queryFn: () => api.get("/settings/smtp").then((r) => r.data),
  });

  useEffect(() => {
    if (data) form.setFieldsValue(data);
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: (values: any) => api.put("/settings/smtp", values),
    onSuccess: () => message.success("SMTP ayarlari kaydedildi"),
    onError: (err: any) => message.error(err?.response?.data?.error?.message || "Hata"),
  });

  const testMutation = useMutation({
    mutationFn: (to: string) => api.post("/settings/smtp/test", { to }),
    onSuccess: () => message.success("Test e-postasi gonderildi!"),
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || "Test basarisiz";
      message.error(msg);
    },
  });

  if (isLoading) return <Card loading />;

  return (
    <div>
      <Title level={3}>SMTP E-posta Ayarlari</Title>

      <Card style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate(values)}
        >
          <Form.Item name="smtp_host" label="SMTP Sunucu" rules={[{ required: true }]}>
            <Input placeholder="smtp.gmail.com" />
          </Form.Item>

          <Form.Item name="smtp_port" label="Port" rules={[{ required: true }]}>
            <InputNumber min={1} max={65535} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="smtp_secure" label="SSL/TLS" valuePropName="checked">
            <Switch checkedChildren="SSL" unCheckedChildren="STARTTLS" />
          </Form.Item>

          <Form.Item name="smtp_user" label="Kullanici Adi / E-posta" rules={[{ required: true }]}>
            <Input placeholder="servisnet@gmail.com" />
          </Form.Item>

          <Form.Item name="smtp_pass" label="Uygulama Sifresi" extra="Gmail icin uygulama sifresi olusturun">
            <Input.Password placeholder="****" />
          </Form.Item>

          <Form.Item name="smtp_from_name" label="Gonderen Adi">
            <Input placeholder="ServisNet" />
          </Form.Item>

          <Form.Item name="smtp_from_email" label="Gonderen E-posta">
            <Input placeholder="servisnet@gmail.com" />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending} style={{ marginRight: 8 }}>
              Kaydet
            </Button>
            <Button
              onClick={() => {
                const email = form.getFieldValue("smtp_user");
                if (email) testMutation.mutate(email);
                else message.warning("Once kullanici e-postasi girin");
              }}
              loading={testMutation.isPending}
            >
              Test E-postasi Gonder
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

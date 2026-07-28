import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, App } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { useAuthStore } from "../../stores/auth";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success("Giris basarili");
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || "Giris basarisiz";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f2f5" }}>
      <Card style={{ width: 400, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>ServisNet</Title>
          <Text type="secondary">Servis Takip Sistemi</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, message: "E-posta gerekli" }, { type: "email" }]}>
            <Input prefix={<MailOutlined />} placeholder="E-posta" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "Sifre gerekli" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Sifre" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Giris Yap
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Demo: admin@servisnet.com / admin123
          </Text>
        </div>
      </Card>
    </div>
  );
}

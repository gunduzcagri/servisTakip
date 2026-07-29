import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, App, Tabs, Result } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, SearchOutlined } from "@ant-design/icons";
import { useAuthStore } from "../../stores/auth";
import api from "../../api/client";
import { STATUS_LABELS } from "../services/state-machine";

const { Title, Text } = Typography;

export default function LoginPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f2f5" }}>
      <Card style={{ width: 440, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>ServisNet</Title>
          <Text type="secondary">Servis Takip Sistemi</Text>
        </div>

        <Tabs
          centered
          items={[
            { key: "login", label: "Giris", children: <LoginForm /> },
            { key: "register", label: "Kayit Ol", children: <RegisterForm /> },
            { key: "track", label: "Takip Sorgula", children: <TrackForm /> },
          ]}
        />
      </Card>
    </div>
  );
}

function LoginForm() {
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
      message.error(err?.response?.data?.error?.message || "Giris basarisiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
    </>
  );
}

function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await api.post("/auth/register", values);
      message.success("Kayit basarili, giris yapiliyor...");
      await login(values.email, values.password);
      navigate("/");
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message || "Kayit basarisiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form layout="vertical" onFinish={onFinish} autoComplete="off">
      <Form.Item name="fullName" rules={[{ required: true, message: "Ad soyad gerekli" }]}>
        <Input prefix={<UserOutlined />} placeholder="Ad Soyad" size="large" />
      </Form.Item>
      <Form.Item name="email" rules={[{ required: true, message: "E-posta gerekli" }, { type: "email" }]}>
        <Input prefix={<MailOutlined />} placeholder="E-posta" size="large" />
      </Form.Item>
      <Form.Item name="phone">
        <Input prefix={<PhoneOutlined />} placeholder="Telefon (opsiyonel)" size="large" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, min: 6, message: "En az 6 karakter" }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="Sifre" size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Kayit Ol
        </Button>
      </Form.Item>
    </Form>
  );
}

function TrackForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const onFinish = async (values: { trackingNumber: string }) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.get(`/services/track/${values.trackingNumber}`);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Takip numarasi bulunamadi");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div>
        <Result
          status={result.status === "DELIVERED" ? "success" : "info"}
          title={`Takip No: ${result.trackingNumber}`}
          subTitle={
            <div style={{ textAlign: "left", maxWidth: 300, margin: "0 auto" }}>
              <p><Text strong>Durum:</Text> {STATUS_LABELS[result.status] || result.status}</p>
              {result.faultDescription && (
                <p><Text strong>Ariza:</Text> {result.faultDescription}</p>
              )}
              {result.estimatedCost && (
                <p><Text strong>Tahmini Ucret:</Text> {result.estimatedCost} TL</p>
              )}
              {result.estimatedDelivery && (
                <p><Text strong>Tahmini Teslim:</Text> {new Date(result.estimatedDelivery).toLocaleDateString("tr-TR")}</p>
              )}
              {result.customerApproved !== undefined && (
                <p><Text strong>Musteri Onayi:</Text> {result.customerApproved ? "Onaylandi" : "Bekliyor"}</p>
              )}
            </div>
          }
          extra={
            <Button onClick={() => { setResult(null); setError(""); }}>
              Baska Sorgula
            </Button>
          }
        />
        {result.statusLogs?.length > 0 && (
          <div style={{ maxWidth: 300, margin: "0 auto" }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>Surec Gecmisi:</Text>
            {result.statusLogs.map((log: any, i: number) => (
              <div key={i} style={{ marginBottom: 4, fontSize: 13 }}>
                <Text type="secondary">
                  {STATUS_LABELS[log.status] || log.status}
                  {log.note && ` - ${log.note}`}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(log.createdAt).toLocaleString("tr-TR")}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Text type="secondary" style={{ display: "block", marginBottom: 16, textAlign: "center" }}>
        Cihazinizin durumunu takip numarasi ile sorgulayin.
        <br />
        Giris yapmaniza gerek yoktur.
      </Text>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="trackingNumber" rules={[{ required: true, message: "Takip numarasi gerekli" }]}>
          <Input prefix={<SearchOutlined />} placeholder="Takip No (orn: SRV-00001)" size="large" />
        </Form.Item>
        {error && <Text type="danger" style={{ display: "block", marginBottom: 16 }}>{error}</Text>}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Sorgula
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: "center" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Demo takip no: SRV-00001
        </Text>
      </div>
    </div>
  );
}

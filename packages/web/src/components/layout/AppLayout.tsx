import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Layout, Menu, Button, Typography, Dropdown, Spin } from "antd";
import {
  DashboardOutlined,
  SettingOutlined,
  ToolOutlined,
  LogoutOutlined,
  UserOutlined,
  ShopOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../stores/auth";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = {
  ADMIN: [
    { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/services", icon: <ToolOutlined />, label: "Servis Kayitlari" },
    { key: "/admin/users", icon: <UserOutlined />, label: "Kullanicilar" },
    { key: "/admin/templates", icon: <ShopOutlined />, label: "Sektor Sablonlari" },
    { key: "/admin/parts", icon: <SettingOutlined />, label: "Parca Stok" },
    { key: "/admin/smtp", icon: <MailOutlined />, label: "E-posta Ayarlari" },
  ],
  TECHNICIAN: [
    { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/services", icon: <ToolOutlined />, label: "Servis Islemleri" },
  ],
  CUSTOMER: [
    { key: "/", icon: <DashboardOutlined />, label: "Cihazlarim" },
    { key: "/services", icon: <ToolOutlined />, label: "Servis Kayitlarim" },
  ],
};

export default function AppLayout() {
  const { user, fetchProfile, loading, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return <Spin size="large" style={{ display: "flex", justifyContent: "center", marginTop: 200 }} />;
  }

  if (!user) return null;

  const items = (menuItems as any)[user.role] || [];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text strong style={{ color: "#fff", fontSize: 18 }}>ServisNet</Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[window.location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <Dropdown
            menu={{
              items: [
                { key: "profile", label: `${user.fullName} (${user.role})`, disabled: true },
                { type: "divider" },
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "Cikis Yap",
                  onClick: () => {
                    logout();
                    navigate("/login");
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<UserOutlined />}>
              {user.fullName}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

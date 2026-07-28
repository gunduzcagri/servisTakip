import { useState } from "react";
import { Table, Tag, Button, Modal, Form, Input, Select, Space, Typography, App } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import api from "../../api/client";

const { Title } = Typography;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Yonetici",
  TECHNICIAN: "Teknisyen",
  CUSTOMER: "Musteri",
  CASHIER: "Kasiyer",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "red",
  TECHNICIAN: "blue",
  CUSTOMER: "green",
  CASHIER: "orange",
};

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, roleFilter],
    queryFn: () =>
      api
        .get("/admin/users", { params: { page, limit: 20, role: roleFilter } })
        .then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post("/admin/users", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setModalOpen(false);
      form.resetFields();
      message.success("Kullanici olusturuldu");
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      api.patch(`/admin/users/${editingUser.id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setModalOpen(false);
      setEditingUser(null);
      form.resetFields();
      message.success("Kullanici guncellendi");
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata");
    },
  });

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingUser) {
        updateMutation.mutate(values);
      } else {
        createMutation.mutate(values);
      }
    });
  };

  const columns = [
    { title: "Ad Soyad", dataIndex: "fullName", key: "fullName" },
    { title: "E-posta", dataIndex: "email", key: "email" },
    { title: "Telefon", dataIndex: "phone", key: "phone", render: (v: string) => v || "-" },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role] || role}</Tag>
      ),
    },
    {
      title: "Durum",
      dataIndex: "isActive",
      key: "isActive",
      render: (v: boolean) => (
        <Tag color={v ? "green" : "red"}>{v ? "Aktif" : "Pasif"}</Tag>
      ),
    },
    {
      title: "Kayit Tarihi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) => dayjs(d).format("DD.MM.YYYY"),
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: any) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          Duzenle
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Kullanici Yonetimi</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Yeni Kullanici
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Rol filtrele"
          allowClear
          style={{ width: 160 }}
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1); }}
          options={Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={data?.users || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total || 0,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `Toplam ${t}`,
        }}
      />

      <Modal
        title={editingUser ? "Kullanici Duzenle" : "Yeni Kullanici"}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingUser(null); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="E-posta" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Sifre" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="fullName" label="Ad Soyad" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Telefon">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Rol" rules={[{ required: true }]}>
            <Select options={Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          {editingUser && (
            <Form.Item name="isActive" label="Durum">
              <Select options={[{ value: true, label: "Aktif" }, { value: false, label: "Pasif" }]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

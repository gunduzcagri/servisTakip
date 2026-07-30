import { useState } from "react";
import { Card, Tabs, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, Typography, Row, Col, Statistic, DatePicker, Popconfirm } from "antd";
import { PlusOutlined, FileTextOutlined, MoneyCollectOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { App } from "antd";
import dayjs from "dayjs";

const { Title } = Typography;
const { TextArea } = Input;

export default function AccountingPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceForm] = Form.useForm();
  const [expenseForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  const { data: financialSummary } = useQuery({
    queryKey: ["accounting-summary"],
    queryFn: () => api.get("/accounting/reports/summary").then((r) => r.data),
  });

  const { data: invoices } = useQuery({
    queryKey: ["accounting-invoices"],
    queryFn: () => api.get("/accounting/invoices", { params: { limit: 20 } }).then((r) => r.data),
  });

  const { data: expenses } = useQuery({
    queryKey: ["accounting-expenses"],
    queryFn: () => api.get("/accounting/expenses", { params: { limit: 20 } }).then((r) => r.data),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (values: any) => {
      return api.post("/accounting/invoices", values);
    },
    onSuccess: () => {
      message.success("Fatura olusturuldu");
      setInvoiceModalOpen(false);
      invoiceForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["accounting-invoices"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (values: any) => {
      return api.post("/accounting/expenses", values);
    },
    onSuccess: () => {
      message.success("Gider kaydedildi");
      setExpenseModalOpen(false);
      expenseForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["accounting-expenses"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (values: any) => {
      return api.post(`/accounting/invoices/${selectedInvoice.id}/payment`, values);
    },
    onSuccess: () => {
      message.success("Odeme kaydedildi");
      setPaymentModalOpen(false);
      paymentForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["accounting-invoices"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.put(`/accounting/invoices/${id}/status`, { status });
    },
    onSuccess: () => {
      message.success("Fatura durumu guncellendi");
      queryClient.invalidateQueries({ queryKey: ["accounting-invoices"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/accounting/expenses/${id}`);
    },
    onSuccess: () => {
      message.success("Gider silindi");
      queryClient.invalidateQueries({ queryKey: ["accounting-expenses"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const handleCreateInvoice = () => {
    invoiceForm.resetFields();
    setInvoiceModalOpen(true);
  };

  const handleCreateExpense = () => {
    expenseForm.resetFields();
    setExpenseModalOpen(true);
  };

  const handleAddPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    paymentForm.resetFields();
    setPaymentModalOpen(true);
  };

  const invoiceColumns = [
    {
      title: "Fatura No",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      width: 180,
    },
    {
      title: "Musteri",
      dataIndex: ["customer", "fullName"],
      key: "customer",
      width: 150,
    },
    {
      title: "Takip No",
      dataIndex: ["serviceRecord", "trackingNumber"],
      key: "trackingNumber",
      width: 120,
    },
    {
      title: "Tutar",
      dataIndex: "total",
      key: "total",
      width: 100,
      render: (val: number) => `${val.toFixed(2)} TL`,
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (val: string) => {
        const colors: Record<string, string> = {
          DRAFT: "gray",
          SENT: "blue",
          PAID: "green",
          OVERDUE: "red",
          CANCELLED: "default",
        };
        return <Tag color={colors[val] || "default"}>{val}</Tag>;
      },
    },
    {
      title: "Vade",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 100,
      render: (val: string) => val ? dayjs(val).format("DD.MM.YYYY") : "-",
    },
    {
      title: "Aksiyonlar",
      key: "actions",
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          {record.status !== "PAID" && record.status !== "CANCELLED" && (
            <>
              {record.status === "DRAFT" && (
                <Button size="small" onClick={() => updateInvoiceStatusMutation.mutate({ id: record.id, status: "SENT" })}>
                  Gonder
                </Button>
              )}
              <Button size="small" type="primary" onClick={() => handleAddPayment(record)}>
                Odeme
              </Button>
            </>
          )}
          <Button size="small" onClick={() => navigate(`/accounting/invoices/${record.id}`)}>
            Detay
          </Button>
        </Space>
      ),
    },
  ];

  const expenseColumns = [
    {
      title: "Kategori",
      dataIndex: "category",
      key: "category",
      width: 120,
    },
    {
      title: "Aciklama",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Tutar",
      dataIndex: "amount",
      key: "amount",
      width: 100,
      render: (val: number) => `${val.toFixed(2)} TL`,
    },
    {
      title: "Tedarikci",
      dataIndex: "vendor",
      key: "vendor",
      width: 120,
    },
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
      width: 100,
      render: (val: string) => dayjs(val).format("DD.MM.YYYY"),
    },
    {
      title: "Aksiyonlar",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <Popconfirm title="Silmek istediginize emin misiniz?" onConfirm={() => deleteExpenseMutation.mutate(record.id)}>
          <Button size="small" danger>Sil</Button>
        </Popconfirm>
      ),
    },
  ];

  const items = [
    {
      key: "invoices",
      label: "Faturalar",
      icon: <FileTextOutlined />,
      children: (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <Title level={4}>Fatura Listesi</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateInvoice}>
              Yeni Fatura
            </Button>
          </div>
          <Table
            columns={invoiceColumns}
            dataSource={invoices?.invoices}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: "expenses",
      label: "Giderler",
      icon: <MoneyCollectOutlined />,
      children: (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <Title level={4}>Gider Listesi</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateExpense}>
              Yeni Gider
            </Button>
          </div>
          <Table
            columns={expenseColumns}
            dataSource={expenses?.expenses}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3}>On Muhasebe</Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Toplam Gelir" value={financialSummary?.revenue || 0} precision={2} prefix="₺" valueStyle={{ color: "#3f8600" }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Toplam Gider" value={financialSummary?.expenses || 0} precision={2} prefix="₺" valueStyle={{ color: "#cf1322" }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Kar/Zarar" value={(financialSummary?.profit || 0).toFixed(2)} precision={2} suffix="₺" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Toplam Fatura" value={financialSummary?.totalInvoices || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Odenen Fatura" value={financialSummary?.paidInvoices || 0} valueStyle={{ color: "#3f8600" }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Tahsil Edilecek" value={financialSummary?.outstandingInvoices || 0} precision={2} prefix="₺" valueStyle={{ color: "#fa8c16" }} />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />

      {/* Invoice Modal */}
      <Modal
        title="Yeni Fatura"
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form
          form={invoiceForm}
          layout="vertical"
          onFinish={(values) => createInvoiceMutation.mutate(values)}
        >
          <Form.Item name="type" label="Fatura Tipi" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="SALES">Satis Faturasi</Select.Option>
              <Select.Option value="PURCHASE">Alis Faturasi</Select.Option>
              <Select.Option value="PROFORMA">Proforma Fatura</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="items" label="Kalemler">
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map((field) => (
                    <Space key={field.key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                      <Form.Item name={[field.name, "description"]} noStyle rules={[{ required: true }]}>
                        <Input placeholder="Aciklama" style={{ width: 200 }} />
                      </Form.Item>
                      <Form.Item name={[field.name, "quantity"]} noStyle rules={[{ required: true }]}>
                        <InputNumber placeholder="Adet" min={1} style={{ width: 80 }} />
                      </Form.Item>
                      <Form.Item name={[field.name, "unitPrice"]} noStyle rules={[{ required: true }]}>
                        <InputNumber placeholder="Birim Fiyat" min={0} style={{ width: 120 }} />
                      </Form.Item>
                      <Button type="link" danger onClick={() => remove(field.name)}>Sil</Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>+ Kaleme Ekle</Button>
                </div>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item name="notes" label="Notlar">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="dueDate" label="Vade Tarihi">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createInvoiceMutation.isPending} block>
              Olustur
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Expense Modal */}
      <Modal
        title="Yeni Gider"
        open={expenseModalOpen}
        onCancel={() => setExpenseModalOpen(false)}
        footer={null}
      >
        <Form
          form={expenseForm}
          layout="vertical"
          onFinish={(values) => createExpenseMutation.mutate(values)}
        >
          <Form.Item name="category" label="Kategori" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="KIRA">Kira</Select.Option>
              <Select.Option value="ELEKTRIK">Elektrik</Select.Option>
              <Select.Option value="SU">Su</Select.Option>
              <Select.Option value="INTERNET">Internet/Telefon</Select.Option>
              <Select.Option value="MALZEME">Malzeme</Select.Option>
              <Select.Option value="ULASIM">Ulasim/Yakit</Select.Option>
              <Select.Option value="DIGER">Diger</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Aciklama" rules={[{ required: true }]}>
            <TextArea />
          </Form.Item>
          <Form.Item name="amount" label="Tutar" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: "100%" }} prefix="₺" />
          </Form.Item>
          <Form.Item name="vendor" label="Tedarikci">
            <Input />
          </Form.Item>
          <Form.Item name="invoiceNo" label="Fatura No">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createExpenseMutation.isPending} block>
              Kaydet
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        title="Odeme Ekle"
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        footer={null}
      >
        {selectedInvoice && (
          <Form
            form={paymentForm}
            layout="vertical"
            onFinish={(values) => createPaymentMutation.mutate(values)}
          >
            <p>Fatura: <strong>{selectedInvoice.invoiceNumber}</strong></p>
            <p>Kalan Tutar: <strong>{(selectedInvoice.total - (selectedInvoice.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0)).toFixed(2)} TL</strong></p>
            <Form.Item name="amount" label="Odeme Tutari" rules={[{ required: true }]}>
              <InputNumber min={0} precision={2} style={{ width: "100%" }} prefix="₺" />
            </Form.Item>
            <Form.Item name="method" label="Odeme Yontemi" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="CASH">Nakit</Select.Option>
                <Select.Option value="BANK_TRANSFER">Banka Havalesi</Select.Option>
                <Select.Option value="CREDIT_CARD">Kredi Karti</Select.Option>
                <Select.Option value="DEBIT_CARD">Banka Karti</Select.Option>
                <Select.Option value="CHECK">Cek</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="reference" label="Referans/Dekont No">
              <Input />
            </Form.Item>
            <Form.Item name="notes" label="Notlar">
              <TextArea rows={2} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={createPaymentMutation.isPending} block>
                Kaydet
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}

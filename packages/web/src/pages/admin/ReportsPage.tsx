import { Card, Col, Row, Statistic, Typography, Table, Progress, Empty } from "antd";
import {
  DollarOutlined,
  ToolOutlined,
  TeamOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import api from "../../api/client";

const { Title } = Typography;

const COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2", "#eb2f96", "#fa8c16", "#2f54eb", "#a0d911"];

export default function ReportsPage() {
  const { data: revenue } = useQuery({
    queryKey: ["report-revenue"],
    queryFn: () => api.get("/reports/revenue").then((r) => r.data),
  });

  const { data: faults } = useQuery({
    queryKey: ["report-faults"],
    queryFn: () => api.get("/reports/faults").then((r) => r.data),
  });

  const { data: technicians } = useQuery({
    queryKey: ["report-technicians"],
    queryFn: () => api.get("/reports/technicians").then((r) => r.data),
  });

  const { data: statusSummary } = useQuery({
    queryKey: ["report-status"],
    queryFn: () => api.get("/reports/status").then((r) => r.data),
  });

  const { data: satisfaction } = useQuery({
    queryKey: ["report-satisfaction"],
    queryFn: () => api.get("/reports/satisfaction").then((r) => r.data),
  });

  const techColumns = [
    { title: "Teknisyen", dataIndex: "fullName", key: "fullName" },
    { title: "Toplam Is", dataIndex: "totalRecords", key: "totalRecords" },
    { title: "Tamamlanan", dataIndex: "completed", key: "completed" },
    {
      title: "Tamamlama Orani",
      key: "rate",
      render: (_: any, r: any) => (
        <Progress
          percent={r.totalRecords > 0 ? Math.round((r.completed / r.totalRecords) * 100) : 0}
          size="small"
        />
      ),
    },
    {
      title: "Ort. Sure (dk)",
      dataIndex: "avgTimeMin",
      key: "avgTimeMin",
    },
  ];

  const statCols = [
    {
      title: "Durum",
      dataIndex: "label",
      key: "label",
    },
    {
      title: "Adet",
      dataIndex: "count",
      key: "count",
    },
    {
      title: "Dagilim",
      key: "bar",
      render: (_: any, r: any) => {
        const max = Math.max(...(statusSummary || []).map((s: any) => s.count || 0), 1);
        const pct = r.count ? Math.round((r.count / max) * 100) : 0;
        return <Progress percent={pct} size="small" showInfo={false} />;
      },
    },
  ];

  return (
    <div>
      <Title level={3}>Raporlama ve Analitik</Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Aylik Ciro"
              value={revenue?.totalRevenue || 0}
              suffix="TL"
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Servis Kaydi"
              value={revenue?.totalRecords || 0}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Teknisyen"
              value={technicians?.length || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Memnuniyet"
              value={satisfaction?.avgScore || 0}
              suffix="/ 5"
              prefix={<SmileOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Ariza Dagilimi">
            {faults?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={faults}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {faults.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Veri yok" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Durum Dagilimi">
            {statusSummary?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" angle={-35} textAnchor="end" height={80} fontSize={11} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1677ff" name="Adet" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Veri yok" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Musteri Memnuniyeti">
            {satisfaction?.distribution?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={satisfaction.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" label={{ value: "Puan", position: "bottom" }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#52c41a" name="Degerlendirme" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Henuz degerlendirme yok" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Gelir Dagilimi">
            {revenue ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Parca Geliri", value: revenue.partsRevenue || 0 },
                      { name: "Iscilik Geliri", value: revenue.laborRevenue || 0 },
                      { name: "Diger", value: Math.max(0, revenue.totalRevenue - (revenue.partsRevenue || 0) - (revenue.laborRevenue || 0)) },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value} TL`}
                  >
                    <Cell fill="#1677ff" />
                    <Cell fill="#52c41a" />
                    <Cell fill="#faad14" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Veri yok" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Teknisyen Performans Tablosu */}
      <Card title="Teknisyen Performansi" style={{ marginBottom: 24 }}>
        <Table
          columns={techColumns}
          dataSource={technicians || []}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Durum Tablosu */}
      <Card title="Servis Durum Ozeti">
        <Table
          columns={statCols}
          dataSource={statusSummary || []}
          rowKey="status"
          pagination={false}
        />
      </Card>
    </div>
  );
}

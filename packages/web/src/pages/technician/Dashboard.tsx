import { Card, Col, Row, Statistic, Typography } from "antd";
import { ToolOutlined, CheckCircleOutlined, ClockCircleOutlined, InboxOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";

const { Title } = Typography;

export default function TechnicianDashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.get("/dashboard/summary").then((r) => r.data),
  });

  const stats = data || { totalToday: 0, received: 0, repairing: 0, ready: 0 };

  return (
    <div>
      <Title level={3}>Teknisyen Paneli</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Bugunku Islemler" value={stats.totalToday} prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Bekleyen" value={stats.received} prefix={<ClockCircleOutlined />} valueStyle={{ color: "#faad14" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Onarimda" value={stats.repairing} prefix={<ToolOutlined />} valueStyle={{ color: "#1677ff" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Teslime Hazir" value={stats.ready} prefix={<CheckCircleOutlined />} valueStyle={{ color: "#52c41a" }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

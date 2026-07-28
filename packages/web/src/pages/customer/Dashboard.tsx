import { Card, Typography, Empty } from "antd";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";

const { Title, Text } = Typography;

export default function CustomerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-services"],
    queryFn: () => api.get("/services").then((r) => r.data),
  });

  return (
    <div>
      <Title level={3}>Cihazlarim</Title>
      {isLoading ? (
        <Card loading />
      ) : data?.records?.length ? (
        <div>
          {data.records.map((record: any) => (
            <Card key={record.id} style={{ marginBottom: 16 }}>
              <Text strong>Takip No: {record.trackingNumber}</Text>
              <br />
              <Text>Durum: {record.status}</Text>
              <br />
              <Text type="secondary">{record.faultDescription}</Text>
            </Card>
          ))}
        </div>
      ) : (
        <Empty description="Henuz servis kaydiniz bulunmamaktadir" />
      )}
    </div>
  );
}

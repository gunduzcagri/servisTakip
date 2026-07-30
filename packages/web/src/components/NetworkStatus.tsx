import { Tag, Tooltip } from "antd";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { CloudOutlined, WifiOutlined, SyncOutlined } from "@ant-design/icons";

export function NetworkStatus() {
  const { isOnline, pendingSync } = useOnlineStatus();

  if (isOnline && pendingSync === 0) {
    return (
      <Tooltip title="Çevrimiçi">
        <Tag icon={<CloudOutlined />} color="success">
          Çevrimiçi
        </Tag>
      </Tooltip>
    );
  }

  if (isOnline && pendingSync > 0) {
    return (
      <Tooltip title={`${pendingSync} işlem senkronize ediliyor...`}>
        <Tag icon={<SyncOutlined spin />} color="processing">
          Senkronize: {pendingSync}
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Çevrimdışı - Veriler yerel olarak kaydediliyor">
      <Tag icon={<WifiOutlined />} color="warning">
        Çevrimdışı
      </Tag>
    </Tooltip>
  );
}

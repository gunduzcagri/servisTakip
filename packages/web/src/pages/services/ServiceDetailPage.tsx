import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Timeline,
  Button,
  Select,
  Input,
  Modal,
  Form,
  Space,
  Typography,
  Image,
  App,
  List,
  InputNumber,
} from "antd";
import {
  ArrowLeftOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import api from "../../api/client";
import { useAuthStore } from "../../stores/auth";
import { STATUS_LABELS } from "./state-machine";

const { Title, Text } = Typography;

const VALID_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ["INSPECTING", "CANCELLED"],
  INSPECTING: ["PRICE_OFFER", "CANCELLED"],
  PRICE_OFFER: ["APPROVED", "CANCELLED"],
  APPROVED: ["PARTS_WAITING", "REPAIRING", "CANCELLED"],
  PARTS_WAITING: ["REPAIRING", "CANCELLED"],
  REPAIRING: ["QC", "CANCELLED"],
  QC: ["READY", "REPAIRING"],
  READY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [statusModal, setStatusModal] = useState(false);
  const [quoteModal, setQuoteModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [photoModal, setPhotoModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState("BEFORE");
  const [photoNote, setPhotoNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: () => api.get(`/services/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (body: { status: string; note?: string }) =>
      api.patch(`/services/${id}/status`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      setStatusModal(false);
      message.success("Durum guncellendi");
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const quoteMutation = useMutation({
    mutationFn: (body: any) => api.post(`/services/${id}/quote`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      setQuoteModal(false);
      message.success("Fiyat teklifi gonderildi");
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const actionMutation = useMutation({
    mutationFn: (body: any) => api.post(`/services/${id}/actions`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      setActionModal(false);
      message.success("Islem kaydedildi");
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  const photoMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("file", file!);
      formData.append("type", photoType);
      if (photoNote) formData.append("note", photoNote);
      return api.post(`/services/${id}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      setPhotoModal(false);
      setFile(null);
      setPhotoNote("");
      message.success("Fotograf yuklendi");
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error?.message || "Hata olustu");
    },
  });

  if (isLoading) return <Card loading />;
  if (!data) return <Card>Kayit bulunamadi</Card>;

  const availableStatuses = VALID_TRANSITIONS[data.status] || [];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/services")}
        style={{ marginBottom: 16 }}
      >
        Geri
      </Button>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          {data.trackingNumber}
        </Title>
        <Space>
          {(user?.role === "ADMIN" || user?.role === "TECHNICIAN") && (
            <>
              <Button onClick={() => setActionModal(true)}>Islem Ekle</Button>
              <Button icon={<CameraOutlined />} onClick={() => setPhotoModal(true)}>
                Fotograf
              </Button>
              {availableStatuses.length > 0 && (
                <Button
                  type="primary"
                  onClick={() => {
                    setSelectedStatus(availableStatuses[0]);
                    setStatusModal(true);
                  }}
                >
                  Durum Guncelle
                </Button>
              )}
              {data.status === "INSPECTING" && (
                <Button type="primary" onClick={() => setQuoteModal(true)}>
                  Fiyat Teklifi
                </Button>
              )}
            </>
          )}
        </Space>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div>
          <Card title="Servis Detayi" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Durum">
                <Tag color="blue">{STATUS_LABELS[data.status] || data.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Musteri">
                {data.customer?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Telefon">
                {data.customer?.phone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="E-posta">
                {data.customer?.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Cihaz">
                {data.device?.template?.name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ariza">
                {data.faultDescription || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Tahmini Ucret">
                {data.estimatedCost ? `${data.estimatedCost} TL` : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Tahmini Teslim">
                {data.estimatedDelivery
                  ? dayjs(data.estimatedDelivery).format("DD.MM.YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Musteri Onayi">
                <Tag color={data.customerApproved ? "green" : "red"}>
                  {data.customerApproved ? "Onaylandi" : "Onaylanmadi"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Teknisyen">
                {data.technician?.fullName || "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {data.device?.dynamicFields && Object.keys(data.device.dynamicFields).length > 0 && (
            <Card title="Cihaz Detayi" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                {Object.entries(data.device.dynamicFields as Record<string, string>).map(
                  ([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {value}
                    </Descriptions.Item>
                  )
                )}
              </Descriptions>
            </Card>
          )}

          <Card title="Yapilan Islemler" style={{ marginBottom: 16 }}>
            {data.actions?.length ? (
              <List
                dataSource={data.actions}
                renderItem={(action: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={action.description}
                      description={
                        <Space>
                          {action.laborCost && (
                            <Text>Isçilik: {action.laborCost} TL</Text>
                          )}
                          {action.timeSpentMin && (
                            <Text>Sure: {action.timeSpentMin} dk</Text>
                          )}
                          <Text type="secondary">
                            {dayjs(action.createdAt).format("DD.MM.YYYY HH:mm")}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Henuz islem kaydi yok</Text>
            )}
          </Card>

          <Card title="Kullanilan Parcalar" style={{ marginBottom: 16 }}>
            {data.serviceParts?.length ? (
              <List
                dataSource={data.serviceParts}
                renderItem={(sp: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${sp.part?.name} (${sp.part?.sku})`}
                      description={`${sp.quantity} adet x ${sp.unitPriceAtTime} TL`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Henuz parca kullanilmadi</Text>
            )}
          </Card>

          <Card title="Fotograflar" style={{ marginBottom: 16 }}>
            {data.photos?.length ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {data.photos.map((photo: any) => (
                    <div key={photo.id}>
                      <Image
                        src={photo.url}
                        width={120}
                        height={120}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                      />
                      <br />
                      <Tag style={{ marginTop: 4 }}>
                        {photo.type === "BEFORE" ? "Once" : photo.type === "DURING" ? "Sirasi" : "Sonra"}
                      </Tag>
                    </div>
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Text type="secondary">Henuz fotograf yuklenmedi</Text>
            )}
          </Card>
        </div>

        <div>
          <Card title="Durum Gecmisi" style={{ marginBottom: 16 }}>
            <Timeline
              items={data.statusLogs?.map((log: any) => ({
                children: (
                  <div>
                    <Text strong>{STATUS_LABELS[log.status] || log.status}</Text>
                    {log.note && (
                      <>
                        <br />
                        <Text type="secondary">{log.note}</Text>
                      </>
                    )}
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(log.createdAt).format("DD.MM.YYYY HH:mm")}
                    </Text>
                    {log.changedByUser && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {log.changedByUser.fullName}
                        </Text>
                      </>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>

          {data.ratings?.length > 0 && (
            <Card title="Degerlendirme">
              {data.ratings.map((r: any) => (
                <div key={r.id}>
                  <Text strong>Puan: {r.score}/5</Text>
                  {r.comment && (
                    <>
                      <br />
                      <Text>{r.comment}</Text>
                    </>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        title="Durum Guncelle"
        open={statusModal}
        onCancel={() => setStatusModal(false)}
        onOk={() =>
          updateStatusMutation.mutate({ status: selectedStatus })
        }
        confirmLoading={updateStatusMutation.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="Yeni Durum">
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={availableStatuses.map((s) => ({
                value: s,
                label: STATUS_LABELS[s] || s,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Quote Modal */}
      <Modal
        title="Fiyat Teklifi"
        open={quoteModal}
        onCancel={() => setQuoteModal(false)}
        onOk={() => {
          const form = document.getElementById("quoteForm") as any;
          quoteMutation.mutate({
            estimatedCost: form?.estimatedCost?.value
              ? Number(form.estimatedCost.value)
              : 0,
            estimatedDelivery: form?.estimatedDelivery?.value
              ? new Date(form.estimatedDelivery.value).toISOString()
              : undefined,
            note: form?.note?.value || undefined,
          });
        }}
        confirmLoading={quoteMutation.isPending}
      >
        <Form id="quoteForm" layout="vertical">
          <Form.Item label="Tahmini Ucret (TL)" required>
            <Input type="number" name="estimatedCost" />
          </Form.Item>
          <Form.Item label="Tahmini Teslim Tarihi">
            <Input type="date" name="estimatedDelivery" />
          </Form.Item>
          <Form.Item label="Not">
            <Input.TextArea name="note" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Action Modal */}
      <Modal
        title="Islem Ekle"
        open={actionModal}
        onCancel={() => setActionModal(false)}
        onOk={() => {
          const form = document.getElementById("actionForm") as any;
          actionMutation.mutate({
            description: form?.description?.value || "",
            laborCost: form?.laborCost?.value
              ? Number(form.laborCost.value)
              : undefined,
            timeSpentMin: form?.timeSpentMin?.value
              ? Number(form.timeSpentMin.value)
              : undefined,
          });
        }}
        confirmLoading={actionMutation.isPending}
      >
        <Form id="actionForm" layout="vertical">
          <Form.Item label="Islem Aciklamasi" required>
            <Input.TextArea name="description" />
          </Form.Item>
          <Form.Item label="Isçilik Ucreti (TL)">
            <Input type="number" name="laborCost" />
          </Form.Item>
          <Form.Item label="Harcanan Sure (dk)">
            <InputNumber name="timeSpentMin" min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal
        title="Fotograf Yukle"
        open={photoModal}
        onCancel={() => {
          setPhotoModal(false);
          setFile(null);
        }}
        onOk={() => photoMutation.mutate()}
        confirmLoading={photoMutation.isPending}
        okButtonProps={{ disabled: !file }}
      >
        <Form layout="vertical">
          <Form.Item label="Fotograf Tipi">
            <Select
              value={photoType}
              onChange={setPhotoType}
              options={[
                { value: "BEFORE", label: "Onarim Oncesi" },
                { value: "DURING", label: "Onarim Sirasi" },
                { value: "AFTER", label: "Onarim Sonrasi" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Not">
            <Input.TextArea value={photoNote} onChange={(e) => setPhotoNote(e.target.value)} />
          </Form.Item>
          <Form.Item label="Dosya">
            <Input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

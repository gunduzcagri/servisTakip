import express from "express";
import cors from "cors";
import { config } from "./common/utils/config";
import { errorHandler } from "./common/middleware/error-handler";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import serviceRoutes from "./modules/service/service.routes";
import partRoutes from "./modules/service/part.routes";
import deviceRoutes from "./modules/service/device.routes";
import templateRoutes from "./modules/template/template.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import reportRoutes from "./modules/report/report.routes";
import qrRoutes from "./modules/qr/qr.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(config.upload.dir));

app.use("/api/auth", authRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/qr", qrRoutes);

app.get("/", (_req, res) => {
  res.json({
    name: "ServisNet API",
    version: "0.1.0",
    docs: "/api/health",
    endpoints: [
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/auth/me",
      "GET /api/services",
      "POST /api/services",
      "GET /api/services/track/:trackingNumber",
      "GET /api/parts",
      "GET /api/templates",
      "GET /api/dashboard/summary",
    ],
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API http://localhost:${config.port} adresinde calisiyor`);
});

export default app;

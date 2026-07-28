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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API http://localhost:${config.port} adresinde calisiyor`);
});

export default app;

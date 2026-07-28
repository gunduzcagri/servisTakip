export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret",
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  upload: {
    dir: process.env.UPLOAD_DIR || "./uploads",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
};

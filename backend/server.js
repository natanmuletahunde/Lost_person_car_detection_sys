require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const expressSanitizer = require("express-sanitizer");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const connectDB = require("./config/database");
const config = require("./config");
const { errorHandler, notFound } = require("./middlewares/errorHandler");
const sanitizeRequest = require("./middlewares/mongoSanitize");
const { swaggerSpec, isSwaggerEnabled, isSwaggerAdminOnly } = require("./config/swagger");
const { protect, authorize } = require("./middlewares/auth");

// ================= ROUTES =================
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const sightingRoutes = require("./routes/sighting.routes");
const detectionRoutes = require("./routes/detection.routes");
const alertRoutes = require("./routes/alert.routes");
const uploadRoutes = require("./routes/upload.routes");
const searchRoutes = require("./routes/search.routes");
const adminRoutes = require("./routes/admin.routes");
const missingPersonRoutes = require("./routes/missingPerson.routes");
const missingVehicleRoutes = require("./routes/missingVehicle.routes");
const notificationAdminRoutes = require("./routes/notification.admin.route");
// 🔥 NEW: split feedback routes
const feedbackUserRoutes = require("./routes/feedback.user.routes");
const feedbackAdminRoutes = require("./routes/feedback.admin.route");
const chapaRoutes = require("./routes/chapa.routes");

const app = express();

// ================= DB =================
connectDB();

// ================= SECURITY =================
app.use(helmet());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: "Too many requests, slow down.",
  })
);

// ================= BODY =================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(sanitizeRequest);
app.use(expressSanitizer());

// ================= FILES =================
const uploadPath = path.join(process.cwd(), "uploads");

app.use(
  "/uploads",
  express.static(uploadPath, {
    maxAge: "1d",
    etag: true,
  })
);

// ================= HEALTH =================
app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, message: "Server running" });
});

// ================= SWAGGER =================
if (isSwaggerEnabled()) {
  const guards = isSwaggerAdminOnly()
    ? [protect, authorize("admin")]
    : [];

  app.use(
    "/api-docs",
    ...guards,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );
}

// ================= ROUTES =================
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/sightings", sightingRoutes);
app.use("/api/v1/detections", detectionRoutes);
// 🔥 USER feedback
app.use("/api/v1/feedback", protect, feedbackUserRoutes);

app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/search", searchRoutes);
// Register core admin routes first so paths like /admin/notifications/settings and /admin/notifications/bulk
// are not shadowed by the narrower /admin/notifications mount below.
app.use("/api/v1/admin", adminRoutes);
app.use(
  "/api/v1/admin/notifications",
  protect,
  authorize("admin"),
  notificationAdminRoutes
);

// 🔥 ADMIN feedback (PATCH /:id with { text, status }; list overlaps GET with admin.routes /feedback)
app.use(
  "/api/v1/admin/feedback",
  protect,
  authorize("admin"),
  feedbackAdminRoutes
);
app.use("/api/v1/missing-persons", missingPersonRoutes);
app.use("/api/v1/missing-vehicles", missingVehicleRoutes);
app.use("/api/v1/chapa", chapaRoutes);

// ================= ERROR =================
app.use(notFound);
app.use(errorHandler);

// ================= SERVER =================
const server = app.listen(config.server.port, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${config.server.port}`);
  
});

// ================= SAFETY =================
process.on("unhandledRejection", (err) => {
  console.error(err);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error(err);
  server.close(() => process.exit(1));
});

module.exports = app;
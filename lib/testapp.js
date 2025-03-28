const express = require("express");
const cors = require("cors");

const app = express();

// dashboard routes
const dashboardRoutes = require("../routes/dashboard/iperformance");

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "hello world" });
});

app.use("/dashboard", dashboardRoutes);

module.exports = app;

require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);


const express = require("express");
const cors = require("cors");
const path = require("path");

const dbConnect = require("./config/db-connect");

const authRouter = require("./routes/auth-routes");
const userRouter = require("./routes/user-routes");
const bookRouter = require("./routes/book-routes");
const loanRouter = require("./routes/loan-routes");
const reservationRouter = require("./routes/reservation-routes");

const app = express();

dbConnect();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/loans", loanRouter);
app.use("/api/v1/reservations", reservationRouter);
app.use("/api/v1/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Route ${req.originalUrl} not found`,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

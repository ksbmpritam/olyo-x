import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Admin Routes
import categoryRouter from "./routes/category.routes.js";

//vender routes  import
import venderRouter from "./routes/vender.routes.js";

// users routes import
import userRouter from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/category", categoryRouter);


app.use("/api/v1/vender", venderRouter);
app.use("/api/v1/users", userRouter);

// http://localhost:8000/api/v1/users/register

export { app };

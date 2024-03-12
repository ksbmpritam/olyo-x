import { Router } from "express";
import {
  createCategory,
  updateCategory,
  updateVenderAvatar,
} from "../controllers/admin/category.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  createCategory
);

router.route("/update").post(updateCategory);

router
  .route("/vender/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateVenderAvatar);

export default router;

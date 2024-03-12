import { Router } from "express";
import {
  registerVender,
  loginVender,
  logoutVender,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentVender,
  updateVenderDetails,
  updateVenderAvatar,
  updateVenderCoverImage,
  getVenderChannelProfile,
} from "../controllers/vendors/vendor.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerVender
);

router.route("/login").post(loginVender);

//secured routes
router.route("/logout").post(verifyJWT, logoutVender);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post( changeCurrentPassword);
router.route("/current-vender").get(verifyJWT, getCurrentVender);
router.route("/update-account").patch(verifyJWT, updateVenderDetails);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateVenderAvatar);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateVenderCoverImage);

router.route("/c/:username").get(verifyJWT, getVenderChannelProfile);

export default router;

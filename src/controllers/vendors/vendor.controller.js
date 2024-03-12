import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Vender } from "../../models/vendor.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const vender = await Vender.findById(userId);
    const accessToken = vender.generateAccessToken();
    const refreshToken = vender.generateRefreshToken();

    vender.refreshToken = refreshToken;
    await vender.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerVender = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    fullName,
    password,
    mobileNo,
    altMobileNo,
    businessName,
  } = req.body;

  if (
    [fullName, email, username, password, mobileNo].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedVender = await Vender.findOne({
    $or: [{ mobileNo }, { email }],
  });

  if (existedVender) {
    throw new ApiError(409, "Vender with email or mobileNo already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const vender = await Vender.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
    mobileNo,
    altMobileNo,
    businessName,
  });

  const createdVender = await Vender.findById(vender._id).select(
    "-password -refreshToken"
  );

  if (!createdVender) {
    throw new ApiError(
      500,
      "Something went wrong while registering the Vender"
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdVender, "Vender registered Successfully")
    );
});

const loginVender = asyncHandler(async (req, res) => {
  const { email, mobileNo, password } = req.body;

  if (!mobileNo && !email) {
    throw new ApiError(400, "mobile No or email is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  const vender = await Vender.findOne({
    $or: [{ mobileNo }, { email }],
  });

  if (!vender) {
    throw new ApiError(404, "Vender does not exist");
  }

  const isPasswordValid = await vender.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Vender credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    vender._id
  );

  const loggedInVender = await Vender.findById(vender._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          vender: loggedInVender,
          accessToken,
          refreshToken,
        },
        "vender logged In Successfully"
      )
    );
});

const logoutVender = asyncHandler(async (req, res) => {
  await Vender.findByIdAndUpdate(
    req.vender._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const vender = await Vender.findById(decodedToken?._id);

    if (!vender) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== vender?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  console.log(req.body);

  const vender = await Vender.findById(req.vender?._id);
  const isPasswordCorrect = await vender.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  vender.password = newPassword;
  await vender.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentVender = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.vender, "Vender fetched successfully"));
});

const updateVenderDetails = asyncHandler(async (req, res) => {
  const {
    businessName,
    ownerName,
    mobileNo,
    altMobileNo,
    category,
    address,
    latitude,
    longitude,
    fcmToken,
  } = req.body;

  if (
    [
      businessName,
      ownerName,
      mobileNo,
      category,
      address,
      latitude,
      longitude,
      fcmToken,
    ].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const vender = await Vender.findByIdAndUpdate(
    req.vender?._id,
    {
      $set: {
        businessName,
        ownerName,
        mobileNo,
        category,
        address,
        latitude,
        longitude,
        fcmToken,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, vender, "Account details updated successfully"));
});

const updateVenderAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  //TODO: delete old image - assignment

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const vender = await Vender.findByIdAndUpdate(
    req.vender?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, vender, "Avatar image updated successfully"));
});

const updateVenderCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  //TODO: delete old image - assignment

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const vender = await Vender.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, vender, "Cover image updated successfully"));
});

const getVenderChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await Vender.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

export {
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
};

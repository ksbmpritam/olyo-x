import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Category } from "../../models/category.model.js";
import { Vender } from "../../models/vendor.model.js"; // Import the Vender model
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const createCategory = asyncHandler(async (req, res) => {
  const { title, isPublished } = req.body;

  //   console.log(req.body);

  if (![title].every((field) => field && field.trim() !== "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedCategory = await Category.findOne({ title });

  if (existedCategory) {
    throw new ApiError(409, "Category already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error uploading avatar");
  }

  const category = await Category.create({
    title,
    avatar: avatar.url,
    isPublished,
  });

  const createdCategory = await Category.findById(category._id);

  if (!createdCategory) {
    throw new ApiError(500, "Something went wrong while creating a category");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdCategory, "Category created successfully")
    );
});

const updateCategory = asyncHandler(async (req, res) => {
  // const { categoryId, title, isPublished } = req.body;
  console.log(req.body);
  // if (!categoryId || !title || !isPublished) {
  //   throw new ApiError(400, "All fields are required");
  // }

  // const updatedCategory = await Category.findByIdAndUpdate(
  //   categoryId,
  //   {
  //     $set: {
  //       title,
  //       isPublished,
  //     },
  //   },
  //   { new: true }
  // );

  // if (!updatedCategory) {
  //   throw new ApiError(404, "Category not found");
  // }

  return res
    .status(200)
    .json(
      new ApiResponse(200, req.body, "Category updated successfully")
    );
});

const updateVenderAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error uploading avatar");
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

export { createCategory, updateCategory, updateVenderAvatar };

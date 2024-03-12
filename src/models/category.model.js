import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const categorySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.plugin(mongooseAggregatePaginate);

export const Category = mongoose.model("Category", categorySchema);

const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      minlength: [1, "Book title cannot be empty"],
      maxlength: [200, "Book title cannot exceed 200 characters"],
    },

    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },

    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: {
        values: [
          "fiction",
          "science",
          "history",
          "biography",
          "technology",
          "fantasy",
          "mystery",
          "children",
          "comics",
          "other",
        ],
        message: "Please provide a valid category",
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    coverImage: {
      type: String,
      trim: true,
    },

    totalCopies: {
      type: Number,
      required: [true, "Total copies is required"],
      min: [0, "Total copies cannot be negative"],
      default: 1,
    },

    availableCopies: {
      type: Number,
      min: [0, "Available copies cannot be negative"],
      default: function () {
        return this.totalCopies;
      },
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.virtual("isAvailable").get(function () {
  return this.availableCopies > 0;
});

bookSchema.set("toJSON", { virtuals: true });
bookSchema.set("toObject", { virtuals: true });

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;

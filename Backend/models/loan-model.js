const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book is required"],
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Member is required"],
    },

    checkedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Librarian who processed the checkout is required"],
    },

    borrowDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },

    returnDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: ["active", "returned", "overdue"],
        message: "Status must be active, returned, or overdue",
      },
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Loan = mongoose.model("Loan", loanSchema);

module.exports = Loan;

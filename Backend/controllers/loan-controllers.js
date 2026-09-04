const Loan = require("../models/loan-model");
const Book = require("../models/book-model");

const DEFAULT_LOAN_DAYS = 14;

const getAllLoans = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const loans = await Loan.find(filter)
      .populate("book", "title author coverImage")
      .populate("member", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: loans.length,
      data: { loans },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Failed to fetch loans: ${error.message}`,
    });
  }
};

const getOverdueLoans = async (req, res) => {
  try {
    const loans = await Loan.find({
      status: "active",
      dueDate: { $lt: new Date() },
    })
      .populate("book", "title author coverImage")
      .populate("member", "name email");

    res.status(200).json({
      status: "success",
      count: loans.length,
      data: { loans },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ member: req.user._id })
      .populate("book", "title author coverImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: loans.length,
      data: { loans },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const checkoutBook = async (req, res) => {
  try {
    const { bookId, memberId, days } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ status: "fail", message: "Book not found" });
    }

    if (book.availableCopies < 1) {
      return res.status(400).json({
        status: "fail",
        message: "No available copies of this book to check out",
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (days || DEFAULT_LOAN_DAYS));

    const loan = await Loan.create({
      book: bookId,
      member: memberId,
      checkedOutBy: req.user._id,
      dueDate,
    });

    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({
      status: "success",
      message: "Book checked out successfully",
      data: { loan },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const renewLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ status: "fail", message: "Loan not found" });
    }
    if (loan.status !== "active" && loan.status !== "overdue") {
      return res.status(400).json({
        status: "fail",
        message: "Only active or overdue loans can be renewed",
      });
    }

    const extendDays = req.body.days || DEFAULT_LOAN_DAYS;
    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + extendDays);

    loan.dueDate = newDueDate;
    loan.status = "active";
    await loan.save();

    res.status(200).json({
      status: "success",
      message: "Loan renewed successfully",
      data: { loan },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const returnBook = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ status: "fail", message: "Loan not found" });
    }
    if (loan.status === "returned") {
      return res.status(400).json({ status: "fail", message: "This loan was already returned" });
    }

    loan.status = "returned";
    loan.returnDate = new Date();
    await loan.save();

    await Book.findByIdAndUpdate(loan.book, { $inc: { availableCopies: 1 } });

    res.status(200).json({
      status: "success",
      message: "Book returned successfully",
      data: { loan },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  getAllLoans,
  getOverdueLoans,
  getMyLoans,
  checkoutBook,
  renewLoan,
  returnBook,
};

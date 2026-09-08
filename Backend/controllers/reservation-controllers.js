const Reservation = require("../models/reservation-model");
const Book = require("../models/book-model");
const Loan = require("../models/loan-model");

const DEFAULT_LOAN_DAYS = 14;

const createReservation = async (req, res) => {
  try {
    const { bookId } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ status: "fail", message: "Book not found" });
    }

    const existing = await Reservation.findOne({
      book: bookId,
      member: req.user._id,
      status: { $in: ["pending", "ready"] },
    });
    if (existing) {
      return res.status(400).json({
        status: "fail",
        message: "You already have an active reservation for this book",
      });
    }

    const reservation = await Reservation.create({
      book: bookId,
      member: req.user._id,
    });

    res.status(201).json({
      status: "success",
      message: "Book reserved successfully",
      data: { reservation },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ member: req.user._id })
      .populate("book", "title author coverImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: reservations.length,
      data: { reservations },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const reservations = await Reservation.find(filter)
      .populate("book", "title author coverImage")
      .populate("member", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: reservations.length,
      data: { reservations },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const markReservationReady = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ status: "fail", message: "Reservation not found" });
    }
    if (reservation.status !== "pending") {
      return res.status(400).json({
        status: "fail",
        message: "Only pending reservations can be marked as ready",
      });
    }

    reservation.status = "ready";
    await reservation.save();

    res.status(200).json({
      status: "success",
      message: "Reservation marked as ready for pickup",
      data: { reservation },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const fulfillReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ status: "fail", message: "Reservation not found" });
    }
    if (reservation.status !== "ready") {
      return res.status(400).json({
        status: "fail",
        message: "Only reservations marked ready can be checked out",
      });
    }

    const book = await Book.findById(reservation.book);
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
    dueDate.setDate(dueDate.getDate() + DEFAULT_LOAN_DAYS);

    const loan = await Loan.create({
      book: reservation.book,
      member: reservation.member,
      checkedOutBy: req.user._id,
      dueDate,
    });

    book.availableCopies -= 1;
    await book.save();

    reservation.status = "fulfilled";
    await reservation.save();

    res.status(200).json({
      status: "success",
      message: "Reservation checked out as a loan",
      data: { loan, reservation },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ status: "fail", message: "Reservation not found" });
    }

    if (req.user.role === "member" && String(reservation.member) !== String(req.user._id)) {
      return res.status(403).json({
        status: "fail",
        message: "You can only cancel your own reservations",
      });
    }

    if (reservation.status === "fulfilled" || reservation.status === "cancelled") {
      return res.status(400).json({
        status: "fail",
        message: `This reservation is already ${reservation.status} and cannot be cancelled`,
      });
    }

    reservation.status = "cancelled";
    await reservation.save();

    res.status(200).json({
      status: "success",
      message: "Reservation cancelled successfully",
      data: { reservation },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  markReservationReady,
  fulfillReservation,
  cancelReservation,
};

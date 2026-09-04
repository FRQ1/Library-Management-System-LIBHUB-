const Book = require("../models/book-model");
const deleteUploadedFile = require("../utils/delete-uploaded-file");

const getAllBooks = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category.toLowerCase();
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [{ title: regex }, { author: regex }];
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: books.length,
      data: { books },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: `Failed to fetch books: ${error.message}`,
    });
  }
};

const createBook = async (req, res) => {
  try {
    const category = req.body.category?.toLowerCase();

    const newBook = await Book.create({
      ...req.body,
      category,
      coverImage: req.file?.filename,
    });

    res.status(201).json({
      status: "success",
      message: "Book added successfully",
      data: { book: newBook },
    });
  } catch (error) {
    if (req.file) {
      deleteUploadedFile("books", req.file.filename);
    }

    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: { book },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ status: "fail", message: "Book not found" });
    }

    if (req.body.category) req.body.category = req.body.category.toLowerCase();

    if (req.file) {
      req.body.coverImage = req.file.filename;
      if (book.coverImage) {
        deleteUploadedFile("books", book.coverImage);
      }
    }

    Object.assign(book, req.body);
    const updatedBook = await book.save();

    res.status(200).json({
      status: "success",
      message: "Book updated successfully",
      data: { book: updatedBook },
    });
  } catch (error) {
    if (req.file) {
      deleteUploadedFile("books", req.file.filename);
    }
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    if (deletedBook.coverImage) {
      deleteUploadedFile("books", deletedBook.coverImage);
    }

    res.status(200).json({
      status: "success",
      message: "Book deleted successfully",
      data: { book: deletedBook },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  getAllBooks,
  createBook,
  getBookById,
  updateBook,
  deleteBook,
};

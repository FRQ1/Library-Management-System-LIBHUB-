const express = require("express");
const bookControllers = require("../controllers/book-controllers");
const upload = require("../middleware/multer-middleware");
const { protect, restrictTo } = require("../middleware/auth-middleware");
const router = express.Router();

router
  .route("/")
  .get(bookControllers.getAllBooks)
  .post(protect, restrictTo("librarian", "admin"), upload.single("coverImage"), bookControllers.createBook);

router
  .route("/:id")
  .get(bookControllers.getBookById)
  .patch(protect, restrictTo("librarian", "admin"), upload.single("coverImage"), bookControllers.updateBook)
  .delete(protect, restrictTo("librarian", "admin"), bookControllers.deleteBook);

module.exports = router;

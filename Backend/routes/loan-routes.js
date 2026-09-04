const express = require("express");
const loanControllers = require("../controllers/loan-controllers");
const { protect, restrictTo } = require("../middleware/auth-middleware");
const router = express.Router();

router.use(protect);

router.get("/my", loanControllers.getMyLoans);

router.get("/overdue", restrictTo("librarian", "admin"), loanControllers.getOverdueLoans);
router.get("/", restrictTo("librarian", "admin"), loanControllers.getAllLoans);
router.post("/", restrictTo("librarian", "admin"), loanControllers.checkoutBook);
router.patch("/:id/renew", restrictTo("librarian", "admin"), loanControllers.renewLoan);
router.patch("/:id/return", restrictTo("librarian", "admin"), loanControllers.returnBook);

module.exports = router;

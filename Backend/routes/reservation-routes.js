const express = require("express");
const reservationControllers = require("../controllers/reservation-controllers");
const { protect, restrictTo } = require("../middleware/auth-middleware");
const router = express.Router();

router.use(protect);

router.get("/my", reservationControllers.getMyReservations);
router.post("/", reservationControllers.createReservation);

router.get("/", restrictTo("librarian", "admin"), reservationControllers.getAllReservations);
router.patch("/:id/ready", restrictTo("librarian", "admin"), reservationControllers.markReservationReady);

router.delete("/:id", reservationControllers.cancelReservation);

module.exports = router;

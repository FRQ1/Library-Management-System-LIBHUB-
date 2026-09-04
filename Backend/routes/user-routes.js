const express = require("express");
const userControllers = require("../controllers/user-controllers");
const upload = require("../middleware/multer-middleware");
const { protect, restrictTo } = require("../middleware/auth-middleware");
const router = express.Router();

router.use(protect);

router.get("/me", userControllers.getMe);
router.patch("/me", userControllers.updateMe);
router.patch("/me/password", userControllers.updateMyPassword);
router.patch("/me/picture", upload.single("profilePicture"), userControllers.updateMyPicture);
router.delete("/me", userControllers.deactivateMe);

router.get("/", restrictTo("admin"), userControllers.getAllUsers);
router.get("/:id", restrictTo("admin"), userControllers.getUserById);
router.patch("/:id/status", restrictTo("admin"), userControllers.updateUserStatus);
router.patch("/:id/role", restrictTo("admin"), userControllers.updateUserRole);
router.delete("/:id", restrictTo("admin"), userControllers.deleteUser);

module.exports = router;

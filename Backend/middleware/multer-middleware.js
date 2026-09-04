const multer = require("multer");
const fs = require("fs");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest = "uploads";
    if (req.baseUrl.includes("books")) {
      dest = "uploads/books";
    } else if (req.baseUrl.includes("users")) {
      dest = "uploads/users";
    }

    try {
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: function (req, file, cb) {
    let fileName = file.originalname;
    let extension = file.mimetype.split("/")[1];

    if (req.baseUrl.includes("books")) {
      fileName = `book-${Date.now()}.${extension}`;
    } else if (req.baseUrl.includes("users")) {
      fileName = `user-${Date.now()}.${extension}`;
    }
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WEBP image files are allowed!"), false);
  }
};

const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

module.exports = upload;

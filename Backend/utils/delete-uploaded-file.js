const fs = require("fs").promises;
const path = require("path");

function deleteUploadedFile(foldername, filename) {
  if (!filename) {
    return;
  }
  const filePath = path.join(__dirname, "..", "uploads", foldername, filename);
  fs.unlink(filePath).catch((err) => {
    console.error(`Error deleting file: ${err.message}`);
  });
}

module.exports = deleteUploadedFile;

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Function to ensure folder exists
const ensureFolderExists = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    let destinationFolder = "images"; // Default folder

    // Assign folder based on field name instead of URL
    if (file.fieldname === "document" || file.fieldname === "file") {
      destinationFolder = "document-library";
    } else if (file.fieldname === "logo") {
      destinationFolder = "logo";
    }  else if (file.fieldname === "banner") {
      destinationFolder = "banner";
    }

    ensureFolderExists(destinationFolder);
    callback(null, destinationFolder);
  },
  filename: (req, file, callback) => {
    const filenameWithoutSpaces = file.originalname.replace(/\s+/g, "");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(filenameWithoutSpaces);
    callback(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

// Allow multiple uploads
const upload = multer({ storage: storage }).fields([
  { name: "background", maxCount: 10 },
  { name: "avatar", maxCount: 5 },
  { name: "document", maxCount: 10 },
  { name: "picture", maxCount: 10 },
  { name: "file", maxCount: 20 },
  { name: "logo", maxCount: 3 },
  { name: "banner", maxCount: 3 },
  { name: "customerPhoto", maxCount: 5 },
  { name: "attachment", maxCount: 10 },
  { name: "checkInOutImage", maxCount: 10 },
]);

module.exports = upload;
const Settings = require("../models/settings");
const fs = require("fs");

exports.updateLogo = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];
    const company = JSON.parse(req.body.company);
    let logoPath = null;

    if (company.logo && company.logo.includes("/logo/")) {
      logoPath = `/logo/${company.logo?.split("/logo/")[1]}`;
    }

    if (req.files && Object.keys(req.files).length > 0) {
      const logoName = company.logo?.split("/logo/")[1];

      if (logoName) {
        fs.unlink("logo/" + logoName, () => {
          console.log("File deleted successfully:", logoName);
        });
      }

      logoPath = `/logo/${req.files.logo[0].filename}`;
    }

    let settings = await Settings.find({ companyDomain });

    if (settings.length === 0) {
      company.companyDomain = companyDomain;
      company.logo = logoPath;
      settings = new Settings(company);
      savedSettings = await settings.save();
      res.status(200).json(savedSettings);
    } else {
      settings = settings[0];

      settings.logo = logoPath;
      settings.companyName = company.companyName;
      settings.address = company.address;
      settings.phone = company.phone;
      settings.email = company.email;
      settings.ownerName = company.ownerName;
      settings.ownerPhone = company.ownerPhone;
      settings.ownerEmail = company.ownerEmail;

      settings = await settings.save();

      res.status(200).json(settings);
    }
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
};

exports.getLogo = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];

    const settings = await Settings.find({companyDomain});
    
    if (settings.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }

    return res.status(200).json(settings[0]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

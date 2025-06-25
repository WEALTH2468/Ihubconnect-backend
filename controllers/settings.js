const Settings = require("../models/settings");
const fs = require("fs");

exports.updateLogo = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];
    const company = JSON.parse(req.body.company);

    let logoPath = company.logo?.includes("/logo/")
      ? `/logo/${company.logo.split("/logo/")[1]}`
      : null;

    let bannerPath = company.banner?.includes("/banner/")
      ? `/banner/${company.banner.split("/banner/")[1]}`
      : null;

    // Handle logo file upload
    if (req.files?.logo?.[0]) {
      const oldLogoName = company.logo?.split("/logo/")[1];
      if (oldLogoName) {
        fs.unlink(`logo/${oldLogoName}`, () => {
        });
      }
      logoPath = `/logo/${req.files.logo[0].filename}`;
    }

    // Handle banner file upload
    if (req.files?.banner?.[0]) {
      const oldBannerName = company.banner?.split("/banner/")[1];
      if (oldBannerName) {
        fs.unlink(`banner/${oldBannerName}`, () => {
        });
      }
      bannerPath = `/banner/${req.files.banner[0].filename}`;
    }

    let settings = await Settings.findOne({ companyDomain });

    if (!settings) {
      const newSettings = new Settings({
        ...company,
        companyDomain,
        logo: logoPath,
        banner: bannerPath,
      });
      const saved = await newSettings.save();
      return res.status(200).json(saved);
    }

    // Update existing settings
    settings.logo = logoPath;
    settings.banner = bannerPath;
    settings.companyName = company.companyName;
    settings.address = company.address;
    settings.phone = company.phone;
    settings.email = company.email;
    settings.ownerName = company.ownerName;
    settings.ownerPhone = company.ownerPhone;
    settings.ownerEmail = company.ownerEmail;

    const updatedSettings = await settings.save();
    res.status(200).json(updatedSettings);
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

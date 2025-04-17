const mongoose = require("mongoose");

const settingsSchema = mongoose.Schema({
    companyDomain:{type: String},
    logo:{type: String},
    banner:{type: String},
    companyName:{type: String},
    address:{type: String},
    phone:{type: String},
    email:{type: String},
    ownerName:{type: String},
    ownerPhone:{type: String},
    ownerEmail:{type: String},
});

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
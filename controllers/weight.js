const Weight = require("../models/weight");
const User = require("../models/user");

const generateRandomColor = () => {
  let color;
  do {
    color = "#";
    const letters = "0123456789ABCDEF";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
  } while (color === "#FFFFFF" || color === "#000000");
  return color;
};

exports.addWeight = async (req, res) => {
  try {
    const { name, value, description } = req.body;

    const newWeight = new Weight({
      name,
      value,
      description,
      companyDomain: req.auth.companyDomain,
      icon: generateRandomColor(),
    });
    await newWeight.save();

    return res
      .status(201)
      .json({ message: "Weight added successfully", weight: newWeight });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: `A weight with the name "${error.keyValue.name}" already exists.`,
      });
    }

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateWeight = async (req, res, next) => {
  const id = req.params.id;
  const weightData = req.body;

  try {
    const updatedWeight = await Weight.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      { ...weightData, updatedAt: new Date().getTime() },
      {
        new: true,
      }
    );
    if (!updatedWeight) {
      return res.status(404).json({ message: "Weight not found" });
    }
    return res.status(200).json({ updatedWeight });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteWeight = async (req, res, next) => {
  try {
    const selectedIds = req.body.ids || req.query.ids;
    await Weight.deleteMany({
      _id: { $in: selectedIds },
      companyDomain: req.auth.companyDomain,
    });
    return res.status(200).json({ message: "Weights deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getWeights = async (req, res, next) => {
  try {
    const userIds = JSON.parse(req.query.users || "[]");

    const query =
      userIds.length > 0
        ? { _id: { $in: userIds }, companyDomain: req.auth.companyDomain }
        : { _id: req.auth.userId, companyDomain: req.auth.companyDomain };

    const users = await User.find(query).populate({
      path: "jobPosition",
      populate: { path: "weights" },
    });

    const userWeights = users.flatMap(
      (user) => user.jobPosition?.weights || []
    );

    const predefinedWeights = await Weight.find({
      name: { $in: ["Task", "Report", "Request"] },
    }).sort({ createdAt: -1 });

    const combinedWeights = [...userWeights, ...predefinedWeights].filter(
      (weight, index, self) =>
        self.findIndex((w) => w._id.toString() === weight._id.toString()) ===
        index
    );

    return res.status(200).json({ weights: combinedWeights });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getAllWeights = async (req, res, next) => {
  try {
    const weights = await Weight.find({
      companyDomain: req.auth.companyDomain,
    });
    return res.status(200).json({ weights });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

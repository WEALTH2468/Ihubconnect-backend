const Teammate = require("../models/teammate");
const fs = require("fs");
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");

const teammateAggregated = async (id) => {
  const teammate = await Teammate.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "basicDetail",
      },
    },
    {
      $unwind: { path: "$basicDetail", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "teams",
        localField: "team",
        foreignField: "_id",
        as: "teamDetail",
      },
    },
    {
      $unwind: {
        path: "$teamDetail",
        preserveNullAndEmptyArrays: true, // in case some teams have no team
      },
    },
  ]);

  return teammate;
};

exports.getTeammates = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];
    const teamsPerFetch = 20;
    const count = Number(req.query.count) || 0;
    const limit = teamsPerFetch;
    const skip = count * teamsPerFetch;

    const teammate = await Teammate.aggregate([
      { $match: { companyDomain } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "basicDetail",
          pipeline: [
            {
              $project: {
                password: 0,
                // Add any other fields you want from the leader object
              },
            },
          ],
        },
      },
      {
        $unwind: { path: "$basicDetail", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "teams",
          localField: "team",
          foreignField: "_id",
          as: "teamDetail",
        },
      },
      {
        $unwind: {
          path: "$teamDetail",
          preserveNullAndEmptyArrays: true, // in case some teams have no team
        },
      },
      {
        $sort: { _id: 1 },
      },
      { $skip: skip },
      { $limit: limit },
    ]);
    return res.status(200).json(teammate);
  } catch (error) {
    console.error(error);
  }
};
exports.getTeammate = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (id == "undefined") {
      const teammate = await Teammate.findOne({ user: req.auth.userId });
      return res.status(200).json(teammate);
    }
    const teammate = await teammateAggregated(id);

    return res.status(200).json(teammate);
  } catch (error) {
    console.error(error);
  }
};
exports.addTeammate = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];

    const data = req.body;
    let result = await Teammate.findOne({ user: data?.user });
    if (result) {
      return res.status(200).json({
        message: "Teammate already exist",
      });
    }
    let newTeammate = new Teammate({
      companyDomain,
      ...data,
    });
    const savedTeammate = await newTeammate.save();
    const teammate = await teammateAggregated(savedTeammate._id);
    return res.status(200).json({
      teammate: teammate[0],
      message: "Created successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTeammate = async (req, res, next) => {
  const ids = JSON.parse(req.params.ids);
  try {
    ids.forEach(async (id) => {
      const teammate = await Teammate.findById(id);
      teammate.attachments.forEach((item) => {
        item && fs.unlink(item.path.slice(1), () => {});
      });
    });
    const data = await Teammate.deleteMany({
      _id: {
        $in: ids,
      },
    });
    return res.status(200).json({
      data,
      message: "Deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateTeammate = async (req, res, next) => {
  try {
    const id = req.params.id;

    if (req.body.data) {
      const data = JSON.parse(req.body.data);
      if (req.files.attachment) {
        const fileName = req.files.attachment[0].filename;
        if (data.attachmentId) {
          data.attachments.forEach((item) => {
            if (item._id === data.attachmentId) {
              fs.unlink(item.path.slice(1), () => {});
              item.path = "/images/" + fileName;
            }
          });
        } else {
          data.attachments.at(0).path = "/images/" + fileName;
        }
      }

      if (req.body.updatedFilePath) {
        fs.unlink(req.body.updatedFilePath.slice(1), () => {});
      }

      if (req.body.deletedFilesPath) {
        const paths = JSON.parse(req.body.deletedFilesPath);
        paths.forEach((item) => {
          item && fs.unlink(item.slice(1), () => {});
        });
      }

      const updatedTeammate = await Teammate.findByIdAndUpdate(
        id, // find the user by id
        { ...data },
        { new: true } // updated data
      );
      const teammate = await teammateAggregated(updatedTeammate._id);

      return res.status(200).json({
        teammate: teammate[0],
        message: "Updated successfully!",
      });
    }
    const updatedTeammate = await Teammate.findByIdAndUpdate(
      id, // find the user by id
      { ...req.body },
      { new: true } // updated data
    );

    const teammate = await teammateAggregated(updatedTeammate._id);

    return res.status(200).json({
      teammate: teammate[0],
      message: "Updated successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.downloadFile = async (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../images", filename);
  // Adjust this path to your file directory

  return res.download(filePath, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send("File not found or an error occurred.");
    }
  });
};

const User = require('../models/user');
const Attendant = require('../models/attendant');
const fs = require('fs');


const fetchAttendant = async (userId, date, companyDomain) => {
  if (userId && date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 1);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const attendant = await Attendant.find({
      user: userId,
      checkIn: {
        $gte: new Date(startOfDay),
        $lte: new Date(endOfDay),
      },
    }).populate({ path: 'user', select: '-password' });

    return attendant;
  }

  if (userId) {
    const attendant = await Attendant.find({
      user: userId,
    }).populate({ path: 'user', select: '-password' });
    return attendant;
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 1);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    console.log({ startOfDay, endOfDay });

    try {
      const attendants = await Attendant.find({
        companyDomain,
        checkIn: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).populate({ path: 'user', select: '-password' });

      return attendants;
    } catch (error) {
      console.error('Error fetching attendants:', error);
      throw error;
    }
  }
};

exports.getUsers = async (req, res) => {
  const companyDomain = req.headers.origin.split('//')[1];
  try {
    const users = await User.find({companyDomain});
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
  }
};

exports.getIsUserCheckedInToday = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const todayDate = new Date();

    const startOfDay = new Date(todayDate);
    startOfDay.setHours(0, 0, 0, 1);

    const endOfDay = new Date(todayDate);
    endOfDay.setHours(23, 59, 59, 999);
    const attendants = await Attendant.find({
      user: userId,
      checkIn: {
        $gte: new Date(startOfDay),
        $lte: new Date(endOfDay),
      },
    }).populate({ path: "user", select: "-password" });

    return res.status(200).json(attendants[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.addAttendant = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split('//')[1];
    const data = JSON.parse(req.body.data);
    const fileName = req.files.checkInOutImage[0].filename;
    const todayDate = new Date();
    const timeOnly = todayDate.toLocaleTimeString()
    const attendant = await fetchAttendant(data.user, todayDate);

    if (attendant[0]) {
      fs.unlink(`images/${fileName}`, () => {});
      return res.status(200).json({
        message: "You have checked in today",
      });
    } else {
      data.checkInImagePath = "/images/" + fileName;
      data.isCheckedIn = true;

      let newAttendant = new Attendant({companyDomain, ...data, checkInNote: data.note });
      await newAttendant.save();
      const attendant = await fetchAttendant(data.user);
      return res.status(200).json({
        attendant: attendant[0],
        message: `Checked-In at ${timeOnly}!`
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateAttendant = async (req, res, next) => {
  try {
    const id = req.params.id;

    //For Checking Out
    if (req.body.data) {
      const todayDate = new Date();
      const timeOnly = todayDate.toLocaleTimeString()
      const fileName = req.files.checkInOutImage[0].filename;
      const data = JSON.parse(req.body.data);
      data.checkOutImagePath = "/images/" + fileName;
      data.isCheckedOut = true;
      await Attendant.findByIdAndUpdate(
        id,
        { ...data, checkOutNote: data.note},
        { new: true }
      );

      const attendant = await fetchAttendant(data.user);

      return res.status(200).json({
        attendant: attendant[0],
        message: `Checked-Out at ${timeOnly}!`
      });
    }

    await Attendant.findByIdAndUpdate(id, { ...req.body }, { new: true });

    const attendant = await fetchAttendant(req.body.user);
    return res.status(200).json({
      attendant: attendant[0],
      message: "Updated successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

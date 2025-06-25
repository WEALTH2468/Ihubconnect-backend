const Attendant = require('../models/attendant');
const fs = require('fs');

const fetchAttendant = async (userId, date, companyDomain) => {

  if (userId && date) {
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);

    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    
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
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);

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

exports.getAttendant = async (req, res, next) => {
  try {
    const { userId, fromDate, toDate } = req.query;

    if (userId && fromDate && toDate) {

      const startOfDay = new Date(fromDate).setHours(0, 0, 0, 0);
      const endOfDay = new Date(toDate).setHours(23, 59, 59, 999);

      const attendants = await Attendant.find({
        user: userId, 
        checkIn: {
          $gte: new Date(startOfDay),
          $lte: new Date(endOfDay),
        },
      }).populate({ path: 'user', select: '-password' });
      return res.status(200).json(attendants);
    }

    if (fromDate && toDate) {
      const { fromDate, toDate } = req.query;
      const startOfDay = new Date(fromDate);
      startOfDay.setHours(0, 0, 0, 1);

      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);

      const attendants = await Attendant.find({
        checkIn: {
          $gte: new Date(startOfDay),
          $lte: new Date(endOfDay),
        },
      }).populate({ path: 'user', select: '-password' });
      return res.status(200).json(attendants);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
exports.getIsUserCheckedInToday = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const todayDate = new Date();

    const startOfDay = new Date(todayDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(todayDate);
    endOfDay.setHours(23, 59, 59, 999);
    const attendants = await Attendant.find({
      user: userId,
      checkIn: {
        $gte: new Date(startOfDay),
        $lte: new Date(endOfDay),
      },
    }).populate({ path: 'user', select: '-password' });

    return res.status(200).json(attendants[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTodayAttendants = async (req, res, next) => {

  try {
    const companyDomain = req.headers.origin.split('//')[1];


    const startOfDay = new Date(req.query.date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(req.query.date).setHours(23, 59, 59, 999);

    const attendants = await Attendant.find({
      companyDomain,
      checkIn: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate({ path: 'user', select: '-password' });

    return res.status(200).json(attendants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendantsByDate = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split('//')[1];

        const todayDate = new Date();



    const startOfDay = new Date(req.query.date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(req.query.date).setHours(23, 59, 59, 999);
   

    const attendants = await Attendant.find({
      companyDomain,
      checkIn: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate({ path: 'user', select: '-password' });

    return res.status(200).json(attendants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }

}



exports.addAttendant = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split('//')[1];
    const fileName = req.files.checkInOutImage[0].filename;
    const { userId } = req.auth;
    const todayDate = new Date().toISOString();
    const attendant = await fetchAttendant(userId, todayDate);
    if (attendant[0]) {
      // Delete the image if the user has already checked in today and try to check in again
      fs.unlink(`images/${fileName}`, () => {});
      return res.status(200).json({
        message: 'You have checked in today',
      });
    } else {
      const data = JSON.parse(req.body.data);
      data.checkInImagePath = '/images/' + fileName;
      data.isCheckedIn = true;

      let newAttendant = new Attendant({ companyDomain, ...data, checkInNote: data.note });
      await newAttendant.save();
      const attendant = await fetchAttendant(data.user);
      return res.status(200).json({
        attendant: attendant[0],
        message: 'Checked-In successfully!',
        date: todayDate,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAttendant = async (req, res, next) => {
  try {
    const id = req.params.id;

    //For Checking Out
    if (req.body.data) {
      const todayDate = new Date().toISOString();
      const fileName = req.files.checkInOutImage[0].filename;
      const data = JSON.parse(req.body.data);
      data.checkOutImagePath = '/images/' + fileName;
      data.isCheckedOut = true;
      await Attendant.findByIdAndUpdate(
        id,
        { ...data, checkOutNote: data.note },
        { new: true }
      );

      const attendant = await fetchAttendant(data.user);

      return res.status(200).json({
        attendant: attendant[0],
        message: `Checked-Out successfully!`,
        date: todayDate,
      });
    }

    if (req.body.status !== 'flagged') {
      req.body.imagePath.forEach((item) => {
        item && fs.unlink(item.slice(1), () => {});
      });
      req.body.checkInImagePath = '';
      req.body.checkOutImagePath = '';
    }

    await Attendant.findByIdAndUpdate(id, { ...req.body }, { new: true });

    const attendant = await fetchAttendant(req.body.user);
    return res.status(200).json({
      attendant: attendant[0],
      message: 'Updated successfully!',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

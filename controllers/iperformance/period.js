const { differenceInDays } = require("date-fns");
const Period = require("../../models/iperformance/period");
const Task = require("../../modules/iperformance/task/task.model");

exports.addPeriod = async (req, res, next) => {
  const { name } = req.body;

  try {
    const period = new Period({
      name,
      companyDomain: req.auth.companyDomain,
    });

    await period.save();
    return res.status(201).json({ period });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updatePeriod = async (req, res, next) => {
  const id = req.params.id;
  const periodData = req.body;

  try {
    const updatedPeriod = await Period.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      { ...periodData, updatedAt: new Date().getTime() },
      {
        new: true,
      }
    );

    if (updatedPeriod.startDate && updatedPeriod.endDate) {
      const today = new Date();
      const beginningOfToday = new Date(today.setHours(0, 0, 0, 0));
      const startDayInFuture =
        new Date(updatedPeriod.startDate).getDay() > beginningOfToday.getDay();

      const timestamp = startDayInFuture
        ? updatedPeriod.startDate
        : beginningOfToday.getTime(); // use the startDate if the specified date is in the future else use today

      const daysLeft = differenceInDays(
        new Date(updatedPeriod.endDate),
        new Date(timestamp)
      );
      updatedPeriod.daysLeft = daysLeft;
      updatedPeriod.save();
    }

    if (!updatedPeriod) {
      return res.status(404).json({ message: "Period not found" });
    }
    return res.status(200).json({ updatedPeriod });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deletePeriod = async (req, res, next) => {
  try {
    const selectedIds = req.body.ids || req.query.ids;
    await Period.deleteMany({
      _id: { $in: selectedIds },
      companyDomain: req.auth.companyDomain,
    });
    return res.status(200).json({ message: "Periods deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getPeriods = async (req, res, next) => {
  try {
    const periods = await Period.find({
      companyDomain: req.auth.companyDomain,
    }).sort({ createdAt: -1 });
    return res.status(200).json({ periods });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getPeriod = async (req, res, next) => {
  const id = req.params.id;

  try {
    let period;
    if (id === "active") {
      period = await Period.findOne({
        status: "In progress",
        companyDomain: req.auth.companyDomain,
      });
    } else {
      period = await Period.findOne({
        _id: id,
        companyDomain: req.auth.companyDomain,
      });
    }

    if (!period) {
      return res.status(200).json({ period: {} });
    }
    return res.status(200).json({ period });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.completePeriod = async (req, res, next) => {
  const id = req.params.id;

  try {
    const period = await Period.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      { status: "Completed", updatedAt: new Date().getTime() },
      { new: true }
    );

    if (!period) {
      return res.status(404).json({ message: "Period not found" });
    }

    const backlogTasks = await Task.find({
      period: id,
      companyDomain: req.auth.companyDomain,
      status: { $ne: "Completed" },
    }); // task to move to backlog
    const completedTasks = await Task.find({
      period: id,
      companyDomain: req.auth.companyDomain,
      status: { $eq: "Completed" },
    }); // tasks to move to archived

    // remove the period ids from the tasks and update them
    const backlogTaskIds = backlogTasks.map((task) => task._id);
    const completedTaskIds = completedTasks.map((task) => task._id);

    await Task.updateMany(
      { _id: { $in: completedTaskIds }, companyDomain: req.auth.companyDomain },
      { archived: true }
    );
    await Task.updateMany(
      { _id: { $in: backlogTaskIds }, companyDomain: req.auth.companyDomain },
      { period: null }
    );

    return res.status(200).json({ period });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

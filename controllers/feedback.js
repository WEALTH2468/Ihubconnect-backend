const Feedback = require("../models/feedback");

exports.addFeedback = async (req, res, next) => {
  // try {
  //     const { name, email, description, category } = req.body;
  //     const feedback = new Feedback({
  //         name,
  //         email,
  //         description,
  //         category,
  //     });
  //     console.log(feedback);
  //     await feedback.save();
  //     // create a new task in iHUB CONNECT MVP - #FEEDBACK
  //     const group = await Group.findOne({
  //         title: 'iHUB CONNECT MVP - #FEEDBACK',
  //     });
  //     if (!group) {
  //         return res
  //             .status(500)
  //             .json({ message: 'Feedback group not found' });
  //     }
  //     const task = new Task({
  //         task:
  //             '#' +
  //             category.slice(0, 1).toUpperCase() +
  //             category.slice(1) +
  //             ' - ' +
  //             description +
  //             ' - ' +
  //             name +
  //             ', ' +
  //             email,
  //         status: 'Not Started',
  //         priority: null,
  //         startDate: new Date().getTime(),
  //         dependentOn: null,
  //         duration: null,
  //         plannedEffort: null,
  //         EffortSpent: null,
  //         ownerIds: [],
  //         Budget: null,
  //         completionDate: new Date().getTime(),
  //         completionAt: null,
  //         archived: false,
  //         createdBy: null,
  //         groupId: group._id,
  //         owner: [],
  //     });
  //     await task.save();
  //     return res.status(200).json({
  //         message: 'Feedback added successfully!',
  //         data: { feedback, task },
  //     });
  // } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ message: error.message });
  // }
};

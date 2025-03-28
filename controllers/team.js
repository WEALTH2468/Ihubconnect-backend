const Team = require('../models/team');
const User = require('../models/user');
const fs = require('fs');
const mongoose = require('mongoose');

const teamAggregated = async (id) => {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'lead',
        foreignField: '_id',
        as: 'leader',
        pipeline: [
          {
            $project: {
              _id: 1,
              displayName: 1,
              avatar: 1,
              // Add any other fields you want from the leader object
            },
          },
        ],
      },
    },
    {
      // Unwind the leader array to convert it into a single object
      $unwind: {
        path: '$leader',
        preserveNullAndEmptyArrays: true, // in case a team doesn't have a leader
      },
    },
    {
      $lookup: {
        from: 'teammates', // assuming 'teammates' is the collection where member details are stored
        localField: '_id',
        foreignField: 'team',
        as: 'members',
      },
    },
    {
      $unwind: {
        path: '$members',
        preserveNullAndEmptyArrays: true, // in case some teams have no members
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'members.user', // assuming `user` is the field in members that references users
        foreignField: '_id',
        as: 'members.userDetails',
        pipeline: [
          {
            $project: {
              _id: 1,
              displayName: 1,
              avatar: 1,
              // Add any other fields you want from the userDetails object
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$members.userDetails',
        preserveNullAndEmptyArrays: true, // in case a member doesn't have corresponding user details
      },
    },
    {
      $group: {
        _id: '$_id',
        parent: { $first: '$parent' },
        lead: { $first: '$lead' },
        leader: { $first: '$leader' },
        name: { $first: '$name' },
        description: { $first: '$description' },
        members: { $push: '$members' },
      },
    },
    {
      // New stage to filter out empty member objects
      $addFields: {
        members: {
          $filter: {
            input: '$members',
            as: 'member',
            cond: { $gt: [{ $size: { $objectToArray: '$$member' } }, 0] },
          },
        },
      },
    },
    {
      $match: { _id: new mongoose.Types.ObjectId(id) },
    },
  ]);

  return teams;
};

const teamsAggregated = async (id) => {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'lead',
        foreignField: '_id',
        as: 'leader',
        pipeline: [
          {
            $project: {
              _id: 1,
              displayName: 1,
              avatar: 1,
              // Add any other fields you want from the leader object
            },
          },
        ],
      },
    },
    {
      // Unwind the leader array to convert it into a single object
      $unwind: {
        path: '$leader',
        preserveNullAndEmptyArrays: true, // in case a team doesn't have a leader
      },
    },
    {
      $lookup: {
        from: 'teammates', // assuming 'teammates' is the collection where member details are stored
        localField: '_id',
        foreignField: 'team',
        as: 'members',
      },
    },
    {
      $unwind: {
        path: '$members',
        preserveNullAndEmptyArrays: true, // in case some teams have no members
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'members.user', // assuming `user` is the field in members that references users
        foreignField: '_id',
        as: 'members.userDetails',
        pipeline: [
          {
            $project: {
              _id: 1,
              displayName: 1,
              avatar: 1,
              // Add any other fields you want from the userDetails object
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$members.userDetails',
        preserveNullAndEmptyArrays: true, // in case a member doesn't have corresponding user details
      },
    },
    {
      $group: {
        _id: '$_id',
        parent: { $first: '$parent' },
        lead: { $first: '$lead' },
        leader: { $first: '$leader' },
        name: { $first: '$name' },
        description: { $first: '$description' },
        members: { $push: '$members' },
      },
    },
    {
      // New stage to filter out empty member objects
      $addFields: {
        members: {
          $filter: {
            input: '$members',
            as: 'member',
            cond: { $gt: [{ $size: { $objectToArray: '$$member' } }, 0] },
          },
        },
      },
    },
    {
      $match: { parent: new mongoose.Types.ObjectId(id) },
    },
  ]);

  return teams;
};

const rootAggregated = async (companyDomain, limit, skip) => {
  const teams = await Team.aggregate([
    {
      $match: { companyDomain }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lead',
        foreignField: '_id',
        as: 'leader',
        pipeline: [
          {
            $project: {
              _id: 1,
              displayName: 1,
              avatar: 1,
              // Add any other fields you want from the leader object
            },
          },
        ],
      },
    },
    {
      // Unwind the leader array to convert it into a single object
      $unwind: {
        path: '$leader',
        preserveNullAndEmptyArrays: true, // in case a team doesn't have a leader
      },
    },
    {
      $lookup: {
        from: 'teammates', // assuming 'teammates' is the collection where member details are stored
        localField: '_id',
        foreignField: 'team',
        as: 'members',
      },
    },
    {
      $unwind: {
        path: '$members',
        preserveNullAndEmptyArrays: true, // in case some teams have no members
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'members.user', // assuming `user` is the field in members that references users
        foreignField: '_id',
        as: 'members.userDetails',
        pipeline: [
          {
            $project: {
              _id: 1,
              displayName: 1,
              avatar: 1,
              // Add any other fields you want from the userDetails object
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$members.userDetails',
        preserveNullAndEmptyArrays: true, // in case a member doesn't have corresponding user details
      },
    },
    {
      $group: {
        _id: '$_id',
        parent: { $first: '$parent' },
        lead: { $first: '$lead' },
        leader: { $first: '$leader' },
        name: { $first: '$name' },
        description: { $first: '$description' },
        members: { $push: '$members' },
      },
    },
    {
      // New stage to filter out empty member objects
      $addFields: {
        members: {
          $filter: {
            input: '$members',
            as: 'member',
            cond: { $gt: [{ $size: { $objectToArray: '$$member' } }, 0] },
          },
        },
      },
    },
    {
      $match: { parent: null }, // Start with root items
    },
    {
      $sort: { _id: 1 },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  return teams;
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({companyDomain}).populate('roleId');
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
  }
};

exports.getTeams = async (req, res) => {
  try {
    const companyDomain = req.headers.origin.split('//')[1];
    const teamsPerFetch = 100;
    const count = Number(req.query.count) || 0;

    const limit = teamsPerFetch;
    const skip = count * teamsPerFetch;

    const teams = await rootAggregated(companyDomain, limit, skip);

    return res.status(200).json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTeam = async (req, res) => {
  try {
    companyDomain = req.headers.origin.split('//')[1];
    const id = req.params.id;
    if (id == 'undefined') {
      const teams = await Team.find({companyDomain}); // teams for dropdown option in frontend
      return res.status(200).json(teams);
    }

    const teams = await teamsAggregated(id);

    return res.status(200).json(teams);
  } catch (error) {
    console.error(error);
  }
};
exports.addTeam = async (req, res) => {
  try {
    const companyDomain = req.headers.origin.split('//')[1];
    const data = req.body;
    let newTeam = new Team({
      companyDomain,
      ...data,
      parent: data?.parent[0] === 'null' ? null : data.parent[0],
      lead: data?.lead[0] ? data.lead[0] : null,
    });
    const savedTeam = await newTeam.save();
    const team = await teamAggregated(savedTeam._id);
    return res.status(200).json({
      team: team[0],
      message: 'Created successfully!',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const ids = JSON.parse(req.params.ids);

    ids.forEach(async (id) => {
      let result = await Team.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $graphLookup: {
            from: 'teams', // Collection name
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'parent',
            as: 'allTeams',
          },
        },
        {
          $project: {
            _id: 1,
            profile: 1,
            'allTeams._id': 1,
            'allTeams.profile': 1,
          },
        },
      ]);

      const parentIdandSubIds = [
        result[0]?._id,
        ...result[0].allTeams.map((item) => item?._id),
      ];

      await Team.deleteMany({
        _id: {
          $in: parentIdandSubIds,
        },
      });
    });

    return res.status(200).json({
      ids,
      message: 'Deleted successfully!',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const updatedTeam = await Team.findByIdAndUpdate(
      id, // find the user by id
      {
        ...data,
        parent: data?.parent[0] ? data.parent[0] : null,
        lead: data?.lead[0] ? data.lead[0] : null,
      },
      { new: true } // updated data
    );
    const team = await teamAggregated(id);
    return res.status(200).json({
      team: team[0],
      message: 'Updated successfully!',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
  companyDomain:{type: String},
  parent: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
  lead: { type: Schema.Types.ObjectId, ref: "User", default: null },
  name: { type: String },
  description: { type: String },
  members: { type: Array, default: [] },
  subRows: { type: Array, default: [] },

});
const Team = mongoose.model('Team', teamSchema);

module.exports = Team;

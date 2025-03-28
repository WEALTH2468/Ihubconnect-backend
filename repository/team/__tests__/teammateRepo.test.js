const mongoose = require("mongoose");
const Teammate = require("../../../models/teammate");
const User = require("../../../models/user");
require("dotenv").config();
const { connect, closeDatabase } = require("../../../lib/testDbUtil");
const { getTotalTeammate } = require("../teammateRepo");

beforeAll(async () => {
  await connect();
});

afterAll(async () => await closeDatabase());

afterEach(async () => {
  await mongoose.connection.collection("teammate").deleteMany({});
});

describe("Teammate Repository - Get Total Teammate", () => {
  it("should return 0 when no teammates exist", async () => {
    await User.deleteMany({});
    await Teammate.deleteMany({});

    const totalTeammate = await getTotalTeammate();

    expect(totalTeammate).toEqual(0);
  });

  it("should throw a MongoBulkWriteError when inserting duplicate teammates", async () => {
    const obj = {
      displayName: "John Doe",
      email: "example@gmail.com",
      password: "12345",
    };

    const user = new User(obj);

    const savedUser = await user.save();

    const teammates = [
      { user: savedUser._id, team: null },
      { user: savedUser._id, team: null },
    ];

    let error;

    try {
      await Teammate.insertMany(teammates);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MongoBulkWriteError");
    expect(error.code).toBe(11000); // Duplicate key error code
  });
});

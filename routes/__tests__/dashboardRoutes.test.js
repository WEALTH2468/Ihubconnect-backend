const app = require("../../lib/testapp");
const request = require("supertest")(app);
const { connect, closeDatabase } = require("../../lib/testDbUtil");

require("dotenv").config();

beforeAll(async () => {
  await connect();
});

afterAll(async () => await closeDatabase());

describe("Dashboard API", () => {
  it("should get summary", async () => {
    const res = await request.get("/dashboard/iperformance/summary");
    expect(res.statusCode).toEqual(200);
  });
  it("should get progress", async () => {
    const res = await request.get("/dashboard/iperformance/progress");
    expect(res.statusCode).toEqual(200);
  })
  it("should get progress", async () => {
    const res = await request.get("/dashboard/iperformance/workload");
    expect(res.statusCode).toEqual(200);
  })
  it("should get top ten goals", async () => {
    const res = await request.get("/dashboard/iperformance/top-goals");
    expect(res.statusCode).toEqual(200);
  })
  it("should get top ten objectives", async () => {
    const res = await request.get("/dashboard/iperformance/top-objectives");
    expect(res.statusCode).toEqual(200);
  })
});

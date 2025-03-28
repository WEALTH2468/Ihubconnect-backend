const mongoose = require("mongoose");
const Goal = require("../../../models/iperformance/goal");
const Task = require("../../../models/iperformance/task")
require("dotenv").config();
const { connect, closeDatabase } = require("../../../lib/testDbUtil");
const { getTopTenGoals } = require("../goalRepo")

beforeAll(async () => {
    await connect();
});

afterAll(async () => await closeDatabase());

afterEach(async () => {
    await mongoose.connection.collection("goals").deleteMany({});
});

describe("Goal Repository - Get top goals", () => {
    it("it should get the top ten goals", async () => {
        const goals = [
            { title: "Goal 1", priority: "Urgent" },
            { title: "Goal 2", priority: "Urgent" },
            { title: "Goal 3", priority: "Medium" }
        ]
        await Goal.insertMany(goals);

        const topTenGoals = await getTopTenGoals();
        expect(topTenGoals).toHaveLength(2);
    })
    it("should return an empty array when there are no goals in the database", async () => {
        // Ensure the database is empty
        await Goal.deleteMany({});

        const topTenGoals = await getTopTenGoals();

        expect(topTenGoals).toHaveLength(0);
        expect(topTenGoals).toEqual([]);
    });
    it("should return only the top ten goals when more than 10 goals exist", async () => {
        const goals = Array.from({ length: 15 }, (_, i) => ({
            title: `Goal ${i + 1}`,
            priority: i < 10 ? "Urgent" : "Low",
        }));
        await Goal.insertMany(goals);

        const topTenGoals = await getTopTenGoals();

        expect(topTenGoals).toHaveLength(10);
        expect(topTenGoals.every(goal => goal.priority === "Urgent")).toBe(true);
    });
    it("should return all 10 goals when there are exactly 10 in the database", async () => {
        const goals = Array.from({ length: 10 }, (_, i) => ({
            title: `Goal ${i + 1}`,
            priority: "Urgent",
        }));

        await Goal.insertMany(goals);

        const topTenGoals = await getTopTenGoals();

        expect(topTenGoals).toHaveLength(10);
        expect(topTenGoals.map(goal => goal.title)).toEqual(
            goals.map(goal => goal.title)
        );
    });
    it("should return goals with identical priorities in the correct order", async () => {
        const goals = [
            { title: "Goal 1", priority: "Urgent" },
            { title: "Goal 2", priority: "Urgent" },
            { title: "Goal 3", priority: "Urgent" },
        ];
        await Goal.insertMany(goals);

        const topTenGoals = await getTopTenGoals();

        expect(topTenGoals).toHaveLength(3);
        expect(topTenGoals.map(goal => goal.title)).toEqual(
            ["Goal 1", "Goal 2", "Goal 3"]
        );
    });
    it("should return an empty array when there are no goals that are urgent in the database", async () => {
        const goals = Array.from({ length: 10 }, (_, i) => ({
            title: `Goal ${i + 1}`,
            priority: "Medium",
        }));

        await Goal.insertMany(goals);

        const topTenGoals = await getTopTenGoals();

        expect(topTenGoals).toHaveLength(0);
        expect(topTenGoals.map(goal => goal.title)).toEqual(
            []
        );
    })
    it("should correctly calculate progress for goals with completed and pending tasks", async () => {
        const goal = await Goal.create({ title: "Goal 1", priority: "Urgent" });
        await Task.insertMany([
            { title: "Task 1", goalId: goal._id, status: "Completed" },
            { title: "Task 2", goalId: goal._id, status: "Not started" },
            { title: "Task 3", goalId: goal._id, status: "In progress" },
        ]);

        const topTenGoals = await getTopTenGoals();
        const progress = topTenGoals[0].progress;

        expect(topTenGoals).toHaveLength(1);
        expect(progress).toBe(33);
    });
    it("should return 100% progress for goals where all tasks are completed", async () => {
        const goal = await Goal.create({ title: "Goal 1", priority: "Urgent" });
        await Task.insertMany([
            { title: "Task 1", goalId: goal._id, status: "Completed" },
            { title: "Task 2", goalId: goal._id, status: "Completed" },
        ]);

        const topTenGoals = await getTopTenGoals();
        const progress = topTenGoals[0].progress;

        expect(progress).toBe(100); // All tasks completed
    });
    it("should return 0% progress for goals where no tasks are completed", async () => {
        const goal = await Goal.create({ title: "Goal 1", priority: "Urgent" });
        await Task.insertMany([
            { title: "Task 1", goalId: goal._id, status: "Not started" },
            { title: "Task 2",  goalId: goal._id, status: "In progress" },
        ]);

        const topTenGoals = await getTopTenGoals();
        const progress = topTenGoals[0].progress;

        expect(progress).toBe(0); // No tasks completed
    });
    it("should return 0% progress for goals with no tasks", async () => {
        const goal = await Goal.create({ title: "Goal 1", priority: "Urgent" });

        const topTenGoals = await getTopTenGoals();
        const progress = topTenGoals[0].progress;

        expect(progress).toBe(0); // No tasks, progress should be 0%
    });
    it("should return correct progress for multiple urgent goals with varying progress", async () => {
        const goals = [
            { title: "Goal 1", priority: "Urgent" },
            { title: "Goal 2", priority: "Urgent" },
            { title: "Goal 3", priority: "Urgent" },
        ];
        const insertedGoals = await Goal.insertMany(goals);

        await Task.insertMany([
            { title: "Task 1", goalId: insertedGoals[0]._id, status: "Completed" },
            { title: "Task 2", goalId: insertedGoals[1]._id, status: "Not started" },
            { title: "Task 3", goalId: insertedGoals[2]._id, status: "Completed" },
            { title: "Task 4", goalId: insertedGoals[2]._id, status: "Not started" },
        ]);

        const topTenGoals = await getTopTenGoals();

        expect(topTenGoals).toHaveLength(3);
        expect(topTenGoals.find(goal => goal.title === "Goal 1").progress).toBe(100);
        expect(topTenGoals.find(goal => goal.title === "Goal 2").progress).toBe(0);
        expect(topTenGoals.find(goal => goal.title === "Goal 3").progress).toBe(50);
    });
})
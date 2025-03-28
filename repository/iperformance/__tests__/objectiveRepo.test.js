const mongoose = require("mongoose");
const Objective = require("../../../models/iperformance/objective");
const Task = require("../../../models/iperformance/task")
require("dotenv").config();
const { connect, closeDatabase } = require("../../../lib/testDbUtil");
const { getTopTenObjectives } = require("../objectiveRepo")

beforeAll(async () => {
    await connect();
});

afterAll(async () => await closeDatabase());

afterEach(async () => {
    await mongoose.connection.collection("objectives").deleteMany({});
});

describe("Objective Repository - Get top objectives", () => {
    it("it should get the top ten objectives", async () => {
        const objectives = [
            { title: "Objective 1", priority: "Urgent" },
            { title: "Objective 2", priority: "Urgent" },
            { title: "Objective 3", priority: "Medium" }
        ]
        await Objective.insertMany(objectives);

        const topTenObjectives = await getTopTenObjectives();
        expect(topTenObjectives).toHaveLength(2);
    })
    it("should return an empty array when there are no objectives in the database", async () => {
        // Ensure the database is empty
        await Objective.deleteMany({});

        const topTenObjectives = await getTopTenObjectives();

        expect(topTenObjectives).toHaveLength(0);
        expect(topTenObjectives).toEqual([]);
    });
    it("should return only the top ten objectives when more than 10 objectives exist", async () => {
        const objectives = Array.from({ length: 15 }, (_, i) => ({
            title: `Objective ${i + 1}`,
            priority: i < 10 ? "Urgent" : "Low",
        }));
        await Objective.insertMany(objectives);

        const topTenObjectives = await getTopTenObjectives();

        expect(topTenObjectives).toHaveLength(10);
        expect(topTenObjectives.every(objective => objective.priority === "Urgent")).toBe(true);
    });
    it("should return all 10 objectives when there are exactly 10 in the database", async () => {
        const objectives = Array.from({ length: 10 }, (_, i) => ({
            title: `Objective ${i + 1}`,
            priority: "Urgent",
        }));

        await Objective.insertMany(objectives);

        const topTenObjectives = await getTopTenObjectives();

        expect(topTenObjectives).toHaveLength(10);
        expect(topTenObjectives.map(objective => objective.title)).toEqual(
            objectives.map(objective => objective.title)
        );
    });
    it("should return objectives with identical priorities in the correct order", async () => {
        const objectives = [
            { title: "Objective 1", priority: "Urgent" },
            { title: "Objective 2", priority: "Urgent" },
            { title: "Objective 3", priority: "Urgent" },
        ];
        await Objective.insertMany(objectives);

        const topTenObjectives = await getTopTenObjectives();

        expect(topTenObjectives).toHaveLength(3);
        expect(topTenObjectives.map(objective => objective.title)).toEqual(
            ["Objective 1", "Objective 2", "Objective 3"]
        );
    });
    it("should return an empty array when there are no objectives that are urgent in the database", async () => {
        const objectives = Array.from({ length: 10 }, (_, i) => ({
            title: `Objective ${i + 1}`,
            priority: "Medium",
        }));

        await Objective.insertMany(objectives);

        const topTenObjectives = await getTopTenObjectives();

        expect(topTenObjectives).toHaveLength(0);
        expect(topTenObjectives.map(objective => objective.title)).toEqual(
            []
        );
    })
    it("should correctly calculate progress for objectives with completed and pending tasks", async () => {
        const objective = await Objective.create({ title: "Objective 1", priority: "Urgent" });
        await Task.insertMany([
            { title: "Task 1", objectiveId: objective._id, status: "Completed" },
            { title: "Task 2", objectiveId: objective._id, status: "Not started" },
            { title: "Task 3", objectiveId: objective._id, status: "In progress" },
        ]);

        const topTenObjectives = await getTopTenObjectives();
        const progress = topTenObjectives[0].progress;

        expect(topTenObjectives).toHaveLength(1);
        expect(progress).toBe(33);
    });
    it("should return 100% progress for objectives where all tasks are completed", async () => {
        const objective = await Objective.create({ title: "Objective 1", priority: "Urgent" });
        await Task.insertMany([
            { title: "Task 1", objectiveId: objective._id, status: "Completed" },
            { title: "Task 2", objectiveId: objective._id, status: "Completed" },
        ]);

        const topTenObjectives = await getTopTenObjectives();
        const progress = topTenObjectives[0].progress;

        expect(progress).toBe(100); // All tasks completed
    });
    it("should return 0% progress for objectives where no tasks are completed", async () => {
        const objective = await Objective.create({ title: "Objective 1", priority: "Urgent" });
        await Task.insertMany([
            { title: "Task 1", objectiveId: objective._id, status: "Not started" },
            { title: "Task 2",  objectiveId: objective._id, status: "In progress" },
        ]);

        const topTenObjectives = await getTopTenObjectives();
        const progress = topTenObjectives[0].progress;

        expect(progress).toBe(0); // No tasks completed
    });
    it("should return 0% progress for objectives with no tasks", async () => {
        const objective = await Objective.create({ title: "Objective 1", priority: "Urgent" });

        const topTenObjectives = await getTopTenObjectives();
        const progress = topTenObjectives[0].progress;

        expect(progress).toBe(0); // No tasks, progress should be 0%
    });
    it("should return correct progress for multiple urgent objectives with varying progress", async () => {
        const objectives = [
            { title: "Objective 1", priority: "Urgent" },
            { title: "Objective 2", priority: "Urgent" },
            { title: "Objective 3", priority: "Urgent" },
        ];
        const insertedObjectives = await Objective.insertMany(objectives);

        await Task.insertMany([
            { title: "Task 1", objectiveId: insertedObjectives[0]._id, status: "Completed" },
            { title: "Task 2", objectiveId: insertedObjectives[1]._id, status: "Not started" },
            { title: "Task 3", objectiveId: insertedObjectives[2]._id, status: "Completed" },
            { title: "Task 4", objectiveId: insertedObjectives[2]._id, status: "Not started" },
        ]);

        const topTenObjectives = await getTopTenObjectives();

        expect(topTenObjectives).toHaveLength(3);
        expect(topTenObjectives.find(objective => objective.title === "Objective 1").progress).toBe(100);
        expect(topTenObjectives.find(objective => objective.title === "Objective 2").progress).toBe(0);
        expect(topTenObjectives.find(objective => objective.title === "Objective 3").progress).toBe(50);
    });
})
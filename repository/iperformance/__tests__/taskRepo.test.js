const mongoose = require("mongoose");
const Task = require("../../../models/iperformance/task");
const Weight = require("../../../models/iperformance/weight")
require("dotenv").config();
const { connect, closeDatabase } = require("../../../lib/testDbUtil");
const { getTaskSummary, getTaskSummaryByStatus, getMonthCategories, getWorkloadSeries } = require("../taskRepo");

beforeAll(async () => {
  await connect();
});

afterAll(async () => await closeDatabase());

afterEach(async () => {
  await mongoose.connection.collection("task2").deleteMany({});
  await mongoose.connection.collection("weights").deleteMany({});
});

describe("Task Repository - Get Summary", () => {
  it("should get correct task summary with mixed statuses", async () => {
    const tasks = [
      { title: "Task 1", status: "Completed" },
      { title: "Task 2", status: "Not Started" },
      { title: "Task 3", status: "In Progress" },
      { title: "Task 4", status: "Completed" },
    ];
    await Task.insertMany(tasks);

    const summary = await getTaskSummary();

    expect(summary).toEqual({
      totalTasks: 4,
      completedTasks: 2,
    });
  });

  it("should handle empty task list", async () => {
    await Task.deleteMany({}); // Ensure the database is empty

    const summary = await getTaskSummary();

    expect(summary).toEqual({
      totalTasks: 0,
      completedTasks: 0,
    });
  });

  it("should return zero completed tasks if none are completed", async () => {
    const tasks = [
      { title: "Task 1", status: "Not Started" },
      { title: "Task 2", status: "In Progress" },
    ];
    await Task.insertMany(tasks);

    const summary = await getTaskSummary();

    expect(summary).toEqual({
      totalTasks: 2,
      completedTasks: 0,
    });
  });

  it("should correctly count tasks regardless of status casing", async () => {
    const tasks = [
      { title: "Task 1", status: "completed" },
      { title: "Task 2", status: "COMPLETED" },
      { title: "Task 3", status: "Completed" },
      { title: "Task 4", status: "In Progress" },
    ];
    await Task.insertMany(tasks);

    const summary = await getTaskSummary();

    expect(summary).toEqual({
      totalTasks: 4,
      completedTasks: 1,
    });
  });
});

describe("Task Repository - Get Summary Status", () => {
  it("should get correct task status summary with mixed statuses", async () => {
    const tasks = [
      { title: "Task 1", status: "Completed" },
      { title: "Task 2", status: "Not started" },
      { title: "Task 3", status: "In progress" },
      {title: "Task 5", status: "In review"},
      { title: "Task 4", status: "Completed" },
    ];
    await Task.insertMany(tasks);

    const summary = await getTaskSummaryByStatus();
    expect(summary).toEqual({
      notStarted: {name: "Not Started", value: 20},
      inProgress: {name: "In Progress", value: 40},
      completed: {name: "Completed", value: 40}
    })
  })
  it("should handle empty task list", async () => {
    await Task.deleteMany({}); // Ensure the database is empty

    const summary = await getTaskSummaryByStatus();

    expect(summary).toEqual({
      notStarted: {name: "Not Started", value: 0},
      inProgress: {name: "In Progress", value: 0},
      completed: {name: "Completed", value: 0}
    });
  });
})

describe("Task Repository - Get Month Categories", () => {
  it("should correctly return the month categories", async () => {
    const tasks = [
      { title: "Task 1", startDate: 1672531200000 }, // January 1, 2023
      { title: "Task 2", startDate: 1675209600000 }, // February 1, 2023
      { title: "Task 3", startDate: 1677628800000 }, // March 1, 2023
      { title: "Task 4", startDate: 1673212800000 }, // January 9, 2023
      { title: "Task 5", startDate: 1675891200000 }, // February 9, 2023
    ];
    
    await Task.insertMany(tasks);
    const monthCategories = await getMonthCategories();

    expect(monthCategories).toEqual(["Jan 2023", "Feb 2023", "Mar 2023"])
  })

  it("should return an empty array when there are no tasks", async () => {
    await Task.deleteMany({}); // Clear the database
  
    const monthCategories = await getMonthCategories();
  
    expect(monthCategories).toEqual([]); // Expect an empty array
  });

  it("should return unique months when multiple tasks are in the same month", async () => {
    const tasks = [
      { title: "Task 1", startDate: 1672531200000 }, // January 1, 2023
      { title: "Task 2", startDate: 1673212800000 }, // January 9, 2023
      { title: "Task 3", startDate: 1675891200000 }, // February 9, 2023
    ];
    
    await Task.insertMany(tasks);
    const monthCategories = await getMonthCategories();
  
    expect(monthCategories).toEqual(["Jan 2023", "Feb 2023"]);
  });

  it("should return months in order when tasks span non-consecutive months", async () => {
    const tasks = [
      { title: "Task 1", startDate: 1672531200000 }, // January 1, 2023
      { title: "Task 2", startDate: 1680307200000 }, // April 1, 2023
      { title: "Task 3", startDate: 1685577600000 }, // June 1, 2023
    ];
  
    await Task.insertMany(tasks);
    const monthCategories = await getMonthCategories();
  
    expect(monthCategories).toEqual(["Jan 2023", "Apr 2023", "Jun 2023"]);
  });

  it("should handle tasks spanning multiple years", async () => {
    const tasks = [
      { title: "Task 1", startDate: 1672531200000 }, // January 1, 2023
      { title: "Task 2", startDate: 1704067200000 }, // January 1, 2024
      { title: "Task 3", startDate: 1707660305401 }, // February 1, 2024
    ];
  
    await Task.insertMany(tasks);
    const monthCategories = await getMonthCategories();
  
    expect(monthCategories).toEqual(["Jan 2023", "Jan 2024", "Feb 2024"]);
  });

  it("should handle tasks with identical start dates", async () => {
    const tasks = [
      { title: "Task 1", startDate: 1672531200000 }, // January 1, 2023
      { title: "Task 2", startDate: 1672531200000 }, // January 1, 2023
    ];
  
    await Task.insertMany(tasks);
    const monthCategories = await getMonthCategories();
  
    expect(monthCategories).toEqual(["Jan 2023"]);
  });

  it("should order months chronologically when tasks are in reverse order", async () => {
    const tasks = [
      { title: "Task 1", startDate: 1677628800000 }, // March 1, 2023
      { title: "Task 2", startDate: 1675209600000 }, // February 1, 2023
      { title: "Task 3", startDate: 1672531200000 }, // January 1, 2023
    ];
  
    await Task.insertMany(tasks);
    const monthCategories = await getMonthCategories();
  
    expect(monthCategories).toEqual(["Jan 2023", "Feb 2023", "Mar 2023"]);
  });

  it("should handle tasks without date", async () => {
    const tasks = [
      { title: "Task 1" }, // No start date
      { title: "Task 2", startDate: 1672531200000 }, // January 1, 2023
      { title: "Task 3" }, // No start date
    ];
  
    await Task.insertMany(tasks);
    const monthCategories = await getMonthCategories();
  
    expect(monthCategories).toEqual(["Jan 2023"]); // Only the valid date tasks should be considered
  });
  
})

describe("Task Repository - Get Workload Series", () => {
  it("should return an empty workload data when no tasks exist", async () => {
    const weights = [
      { name: "Task", value: 1 },
      { name: "Coding", value: 10 }
    ];
    await Weight.insertMany(weights);
  
    const monthCategories = await getMonthCategories();
    const workloadSeries = await getWorkloadSeries(monthCategories);
  
    expect(workloadSeries).toEqual([
      { name: "Coding", data: [] },
      { name: "Task", data: [] }
    ]);
  });


  it("should correctly return the workload series", async () => {
    const weights = [
      {
        name: "Task",
        value: 1
      },
      {
        name: "Coding", 
        value: 10,
      }
    ]
    await Weight.insertMany(weights);
    const weightsMapping = await Weight.find({}).lean();

    const tasks = [
      { title: "Task 1", startDate: 1672531200000, type: "Task" }, // January 1, 2023
      { title: "Task 2", startDate: 1675209600000, type: "Coding" }, // February 1, 2023
      { title: "Task 3", startDate: 1677628800000, type: "Task" }, // March 1, 2023
      { title: "Task 4", startDate: 1673212800000, type: "Coding" }, // January 9, 2023
      { title: "Task 5", startDate: 1675891200000, type: "Task" }, // February 9, 2023
    ];

    tasks.forEach(task => {
      const weight = weightsMapping.find(weight => weight.name === task.type);
      task.weight = weight._id
      delete task.type
    })

   
    
    await Task.insertMany(tasks);
    const monthCategories = await getMonthCategories()
    const workloadSeries = await getWorkloadSeries(monthCategories);
    expect(workloadSeries).toEqual(
      [
        {
          "name": "Coding",
          "data": [1, 1, 0]
        },
        {
          "name": "Task",
          "data": [1, 1, 1]
        }
      ]
    )
  })

  it("should correctly sum workloads for tasks of the same type in a month", async () => {
    const weights = [
      { name: "Task", value: 1 },
      { name: "Coding", value: 10 }
    ];
    await Weight.insertMany(weights);
  
    const weightsMapping = await Weight.find({}).lean()
    const tasks = [
      { title: "Task 1", startDate: 1672531200000, type: "Task" }, // January 1, 2023
      { title: "Task 2", startDate: 1672704000000, type: "Task" }, // January 3, 2023
      { title: "Task 3", startDate: 1675209600000, type: "Coding" } // February 1, 2023
    ];
  
    tasks.forEach((task) => {
      const weight = weightsMapping.find((weight) => weight.name === task.type);
      task.weight = weight._id;
      delete task.type;
    });
    await Task.insertMany(tasks);
  
    const monthCategories = await getMonthCategories();
    const workloadSeries = await getWorkloadSeries(monthCategories);
  
    expect(workloadSeries).toEqual([
      { name: "Coding", data: [0, 1] },
      { name: "Task", data: [2, 0] }
    ]);
  });

  it("should exclude tasks without valid weights", async () => {
    const weights = [
      { name: "Task", value: 1 },
      { name: "Coding", value: 10 }
    ];
    await Weight.insertMany(weights);
    const weightsMapping = await Weight.find({}).lean()
  
    const tasks = [
      { title: "Task 1", startDate: 1672531200000, type: "Task" }, // January 1, 2023
      { title: "Task 2", startDate: 1675209600000, type: "Coding" }, // February 1, 2023
      { title: "Task 3", startDate: 1677628800000, type: "Unknown" } // March 1, 2023 (no weight)
    ];
  
    tasks.forEach((task) => {
      const weight = weightsMapping.find((weight) => weight.name === task.type);
      task.weight = weight ? weight._id : null;
      delete task.type;
    });
  
    await Task.insertMany(tasks);
  
    const monthCategories = await getMonthCategories();
    const workloadSeries = await getWorkloadSeries(monthCategories);
  
   

    expect(workloadSeries).toEqual([
      { name: "Coding", data: [0, 1, 0] },
      { name: "Task", data: [1, 0, 0] }
    ]);
  });

  it("should handle tasks spanning multiple years", async () => {
    const weights = [
      { name: "Task", value: 1 },
      { name: "Coding", value: 10 }
    ];
    await Weight.insertMany(weights);
    const weightsMapping = await Weight.find({}).lean()

  
    const tasks = [
      { title: "Task 1", startDate: 1640995200000, type: "Task" }, // January 1, 2022
      { title: "Task 2", startDate: 1672531200000, type: "Task" }, // January 1, 2023
      { title: "Task 3", startDate: 1704067200000, type: "Coding" } // January 1, 2024
    ];
  
    tasks.forEach((task) => {
      const weight = weightsMapping.find((weight) => weight.name === task.type);
      task.weight = weight._id;
      delete task.type;
    });
  
    await Task.insertMany(tasks);
  
    const monthCategories = await getMonthCategories(); // Ensure categories are for 2023
    const workloadSeries = await getWorkloadSeries(monthCategories);
    

    expect(workloadSeries).toEqual([
      { name: "Coding", data: [0, 0, 1] },
      { name: "Task", data: [1, 1, 0] }
    ]);
  });

  
})

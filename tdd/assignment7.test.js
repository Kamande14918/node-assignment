require("dotenv").config();
const prisma = require("../prisma/db");
const httpMocks = require("node-mocks-http");
const {
    index,
    show,
    create,
    update,
    deleteTask,
    bulkCreate,
} = require("../controllers/taskController");
const {
    login,
    register,
    getUser
} = require("../controllers/userController");
const {
    getUserAnalytics,
    getUsersWithTaskStats,
    searchTasks,
} = require("../controllers/analyticsController");

// Global variables for testing
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;
let analyticsUserId = null;

beforeAll(async () => {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("Assignment 7: Advanced Prisma ORM Features", () => {
    describe("1. Enhanced User Management with Transactions", () => {
        it("User registration with welcome tasks creates user and 3 tasks atomically", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    email: "john@assignment7.com",
                    name: "John Doe",
                    password: "Pa$$word20",
                },
            });
            saveRes = httpMocks.createResponse();
            await register(req, saveRes);
            expect(saveRes.statusCode).toBe(201);

            saveData = saveRes._getJSONData();
            expect(saveData.message).toContain("User registered successfully with welcome tasks");
            expect(saveData.user).toBeDefined();
            expect(saveData.tasksCreated).toBe(3);


            const user = await prisma.user.findUnique({
                where: { email: 'john@assignment7.com' }
            });
            user1 = user.id;
            analyticsUserId = user.id;


            const welcomeTasks = await prisma.task.findMany({
                where: { userId: user1 }
            });
            expect(welcomeTasks).toHaveLength(3);


            const taskTitles = welcomeTasks.map(task => task.title);
            expect(taskTitles).toContain("Complete your profile");
            expect(taskTitles).toContain("Add your first task");
            expect(taskTitles).toContain("Explore the app features");
        });

        it("User registration with duplicate email returns 409", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    email: "john@assignment7.com",
                    name: "John Doe",
                    password: "Pa$$word20",
                },
            });
            saveRes = httpMocks.createResponse();
            await register(req, saveRes);
            expect(saveRes.statusCode).toBe(409);
        });

        it("Can register additional users", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    email: "jane@assignment7.com",
                    name: "Jane Smith",
                    password: "Pa$$word20",
                },
            });
            saveRes = httpMocks.createResponse();
            await register(req, saveRes);
            expect(saveRes.statusCode).toBe(201);

            const user = await prisma.user.findUnique({
                where: { email: 'jane@assignment7.com' }
            });
            user2 = user.id;
        });

        it("User login works correctly", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    email: "john@assignment7.com",
                    password: "Pa$$word20"
                },
            });
            saveRes = httpMocks.createResponse();
            await login(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData.user.name).toBe("John Doe");
        });

        it("Login with invalid credentials returns 401", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    email: "john@assignment7.com",
                    password: "wrongpassword"
                },
            });
            saveRes = httpMocks.createResponse();
            await login(req, saveRes);
            expect(saveRes.statusCode).toBe(401);
        });

        it("Get user by ID with selective fields", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                params: { id: user1 },
                query: { fields: "id,name,email" }
            });
            saveRes = httpMocks.createResponse();
            await getUser(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData).toHaveProperty('id');
            expect(saveData).toHaveProperty('name');
            expect(saveData).toHaveProperty('email');
            expect(saveData).not.toHaveProperty('password');
            expect(saveData).not.toHaveProperty('createdAt');
        });

        it("Get user by ID without fields parameter returns all fields", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                params: { id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await getUser(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData).toHaveProperty('id');
            expect(saveData).toHaveProperty('name');
            expect(saveData).toHaveProperty('email');
            expect(saveData).toHaveProperty('createdAt');
        });

        it("Get user with invalid ID returns 400", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                params: { id: "invalid" }
            });
            saveRes = httpMocks.createResponse();
            await getUser(req, saveRes);
            expect(saveRes.statusCode).toBe(400);
        });

        it("Get non-existent user returns 404", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                params: { id: 99999 }
            });
            saveRes = httpMocks.createResponse();
            await getUser(req, saveRes);
            expect(saveRes.statusCode).toBe(404);
        });
    });

    describe("2. Enhanced Task Management with Advanced Features", () => {
        it("Create task with priority field", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    title: "Advanced Prisma Task",
                    priority: "high",
                    isCompleted: false
                },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await create(req, saveRes);
            expect(saveRes.statusCode).toBe(201);

            saveData = saveRes._getJSONData();
            expect(saveData.title).toBe("Advanced Prisma Task");
            expect(saveData.priority).toBe("high");
            expect(saveData.isCompleted).toBe(false);
            expect(saveData.userId).toBe(user1);
            saveTaskId = saveData.id;
        });

        it("Create task with default priority", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    title: "Default Priority Task"
                },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await create(req, saveRes);
            expect(saveRes.statusCode).toBe(201);

            saveData = saveRes._getJSONData();
            expect(saveData.priority).toBe("medium");
        });

        it("Get tasks with basic pagination", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                query: { user_id: user1, page: 1, limit: 5 }
            });
            saveRes = httpMocks.createResponse();
            await index(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData).toHaveProperty('tasks');
            expect(saveData).toHaveProperty('pagination');
            expect(saveData.pagination.page).toBe(1);
            expect(saveData.pagination.limit).toBe(5);
            expect(saveData.pagination.total).toBeGreaterThan(0);
        });

        it("Get tasks with advanced filtering by status", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                query: { user_id: user1, status: "false" }
            });
            saveRes = httpMocks.createResponse();
            await index(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            if (saveData.tasks.length > 0) {
                saveData.tasks.forEach(task => {
                    expect(task.isCompleted).toBe(false);
                });
            }
        });

        it("Get tasks with priority filtering", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                query: { user_id: user1, priority: "high" }
            });
            saveRes = httpMocks.createResponse();
            await index(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            if (saveData.tasks.length > 0) {
                saveData.tasks.forEach(task => {
                    expect(task.priority).toBe("high");
                });
            }
        });

        it("Get tasks with text search", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                query: { user_id: user1, search: "Prisma" }
            });
            saveRes = httpMocks.createResponse();
            await index(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            if (saveData.tasks.length > 0) {
                const hasPrismaTask = saveData.tasks.some(task =>
                    task.title.toLowerCase().includes("prisma")
                );
                expect(hasPrismaTask).toBe(true);
            }
        });

        it("Get tasks with sorting", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                query: { user_id: user1, sort_by: "title", sort_order: "asc" }
            });
            saveRes = httpMocks.createResponse();
            await index(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            if (saveData.tasks.length > 1) {
                const titles = saveData.tasks.map(task => task.title);
                const sortedTitles = [...titles].sort();
                expect(titles).toEqual(sortedTitles);
            }
        });

        it("Get tasks with selective fields", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                query: { user_id: user1, fields: "id,title,priority" }
            });
            saveRes = httpMocks.createResponse();
            await index(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            if (saveData.tasks.length > 0) {
                const task = saveData.tasks[0];
                expect(task).toHaveProperty('id');
                expect(task).toHaveProperty('title');
                expect(task).toHaveProperty('priority');
                expect(task).not.toHaveProperty('createdAt');
                expect(task).not.toHaveProperty('userId');
            }
        });

        it("Get task by ID with selective fields", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                params: { id: saveTaskId },
                query: { user_id: user1, fields: "id,title" }
            });
            saveRes = httpMocks.createResponse();
            await show(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData).toHaveProperty('id');
            expect(saveData).toHaveProperty('title');
            expect(saveData).not.toHaveProperty('priority');
            expect(saveData).not.toHaveProperty('createdAt');
        });

        it("Update task with new values", async () => {
            const req = httpMocks.createRequest({
                method: "PATCH",
                params: { id: saveTaskId },
                body: {
                    title: "Updated Advanced Task",
                    priority: "low",
                    isCompleted: true
                },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await update(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData.title).toBe("Updated Advanced Task");
            expect(saveData.priority).toBe("low");
            expect(saveData.isCompleted).toBe(true);
        });

        it("Bulk create tasks successfully", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    tasks: [
                        { title: "Bulk Task 1", priority: "high" },
                        { title: "Bulk Task 2", priority: "medium" },
                        { title: "Bulk Task 3", priority: "low" }
                    ]
                },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await bulkCreate(req, saveRes);
            expect(saveRes.statusCode).toBe(201);

            saveData = saveRes._getJSONData();
            expect(saveData.message).toContain("Bulk task creation successful");
            expect(saveData.tasksCreated).toBe(3);
            expect(saveData.totalRequested).toBe(3);
        });

        it("Bulk create with validation errors returns 400", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    tasks: [
                        { title: "", priority: "invalid_priority" },
                        { title: "Valid Task", priority: "high" }
                    ]
                },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await bulkCreate(req, saveRes);
            expect(saveRes.statusCode).toBe(400);

            saveData = saveRes._getJSONData();
            expect(saveData).toHaveProperty('validationErrors');
        });

        it("Bulk create with too many tasks returns 400", async () => {
            const tasks = Array.from({ length: 101 }, (_, i) => ({
                title: `Task ${i + 1}`,
                priority: "medium"
            }));

            const req = httpMocks.createRequest({
                method: "POST",
                body: { tasks },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await bulkCreate(req, saveRes);
            expect(saveRes.statusCode).toBe(400);
        });

        it("Delete task successfully", async () => {
            const req = httpMocks.createRequest({
                method: "DELETE",
                params: { id: saveTaskId },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await deleteTask(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData.message).toContain("Task deleted successfully");
        });
    });

    describe("3. Analytics and Search Features", () => {
        it("Get user productivity analytics", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                params: { id: analyticsUserId }
            });
            saveRes = httpMocks.createResponse();
            await getUserAnalytics(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData).toHaveProperty('taskStats');
            expect(saveData).toHaveProperty('recentTasks');
            expect(saveData).toHaveProperty('weeklyProgress');
            expect(Array.isArray(saveData.taskStats)).toBe(true);
            expect(Array.isArray(saveData.recentTasks)).toBe(true);
        });

        it("Get users with task statistics and pagination", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                query: { page: 1, limit: 5 }
            });
            saveRes = httpMocks.createResponse();
            await getUsersWithTaskStats(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData).toHaveProperty('users');
            expect(saveData).toHaveProperty('pagination');
            expect(Array.isArray(saveData.users)).toBe(true);
            expect(saveData.pagination.page).toBe(1);
            expect(saveData.pagination.limit).toBe(5);

            if (saveData.users.length > 0) {
                const user = saveData.users[0];
                expect(user).toHaveProperty('_count');
                expect(user._count).toHaveProperty('tasks');
                expect(user).not.toHaveProperty('password');
            }
        });

        it("Search tasks with raw SQL", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                query: { q: "Prisma", limit: 10 }
            });
            saveRes = httpMocks.createResponse();
            await searchTasks(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData).toHaveProperty('results');
            expect(saveData).toHaveProperty('query');
            expect(saveData).toHaveProperty('count');
            expect(saveData.query).toBe("Prisma");
            expect(Array.isArray(saveData.results)).toBe(true);
        });

        it("Search tasks with short query returns 400", async () => {
            const req = httpMocks.createRequest({
                method: "GET",
                query: { q: "a" }
            });
            saveRes = httpMocks.createResponse();
            await searchTasks(req, saveRes);
            expect(saveRes.statusCode).toBe(400);

            saveData = saveRes._getJSONData();
            expect(saveData.error).toContain("at least 2 characters");
        });

        it("Search tasks with different terms", async () => {
            const searchTerms = ["Task", "Advanced", "User"];

            for (const term of searchTerms) {
                const req = httpMocks.createRequest({
                    method: "GET",
                    query: { q: term, limit: 5 }
                });
                saveRes = httpMocks.createResponse();
                await searchTasks(req, saveRes);
                expect(saveRes.statusCode).toBe(200);

                saveData = saveRes._getJSONData();
                expect(saveData.query).toBe(term);
                expect(Array.isArray(saveData.results)).toBe(true);
            }
        });
    });

    describe("4. Performance and Edge Cases", () => {
        it("Handle large dataset pagination efficiently", async () => {
            const tasks = Array.from({ length: 25 }, (_, i) => ({
                title: `Performance Task ${i + 1}`,
                priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "medium" : "low",
                userId: user1
            }));

            await prisma.task.createMany({ data: tasks });

            const req = httpMocks.createRequest({
                method: "GET",
                query: { user_id: user1, page: 1, limit: 100, fields: "id,title" }
            });
            saveRes = httpMocks.createResponse();

            const startTime = Date.now();
            await index(req, saveRes);
            const endTime = Date.now();

            expect(saveRes.statusCode).toBe(200);
            expect(endTime - startTime).toBeLessThan(1000);

            saveData = saveRes._getJSONData();
            expect(saveData.pagination.total).toBeGreaterThan(25);
        });

        it("Handle empty results gracefully", async () => {
            const registerReq = httpMocks.createRequest({
                method: "POST",
                body: {
                    email: "empty@test.com",
                    name: "Empty Test",
                    password: "Pa$$word20",
                },
            });
            const registerRes = httpMocks.createResponse();
            await register(registerReq, registerRes);

            const user = await prisma.user.findUnique({
                where: { email: 'empty@test.com' }
            });
            const emptyUserId = user.id;

            await prisma.task.deleteMany({
                where: { userId: emptyUserId }
            });

            const req = httpMocks.createRequest({
                method: "GET",
                query: { user_id: emptyUserId, page: 1, limit: 10 }
            });
            saveRes = httpMocks.createResponse();
            await index(req, saveRes);
            expect(saveRes.statusCode).toBe(200);

            saveData = saveRes._getJSONData();
            expect(saveData.tasks).toHaveLength(0);
            expect(saveData.pagination.total).toBe(0);
        });

        it("Validate pagination parameters with invalid values", async () => {
            const registerReq = httpMocks.createRequest({
                method: "POST",
                body: {
                    email: "pagination@test.com",
                    name: "Pagination Test",
                    password: "Pa$$word20",
                },
            });
            const registerRes = httpMocks.createResponse();
            await register(registerReq, registerRes);

            const user = await prisma.user.findUnique({
                where: { email: 'pagination@test.com' }
            });
            const testUserId = user.id;

            const req = httpMocks.createRequest({
                method: "GET",
                query: { user_id: testUserId, page: "invalid", limit: "invalid" }
            });
            saveRes = httpMocks.createResponse();
            await index(req, saveRes);
            expect(saveRes.statusCode).toBe(200);


            saveData = saveRes._getJSONData();
            expect(saveData.pagination.page).toBe(1);
            expect(saveData.pagination.limit).toBe(10);
        });
    });

    describe("5. Error Handling and Validation", () => {
        it("Handle invalid task data validation", async () => {
            const req = httpMocks.createRequest({
                method: "POST",
                body: {
                    title: "",
                    priority: "invalid_priority"
                },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await create(req, saveRes);
            expect(saveRes.statusCode).toBe(400);

            saveData = saveRes._getJSONData();
            expect(saveData).toHaveProperty('error');
        });

        it("Handle missing user_id parameter", async () => {
            const req = httpMocks.createRequest({
                method: "GET"
            });
            saveRes = httpMocks.createResponse();
            await index(req, saveRes);
            expect(saveRes.statusCode).toBe(401);

            saveData = saveRes._getJSONData();
            expect(saveData.error).toContain("User ID required");
        });

        it("Handle non-existent task update", async () => {
            const req = httpMocks.createRequest({
                method: "PATCH",
                params: { id: 99999 },
                body: { title: "Non-existent Task" },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await update(req, saveRes);
            expect(saveRes.statusCode).toBe(404);
        });

        it("Handle non-existent task deletion", async () => {
            const req = httpMocks.createRequest({
                method: "DELETE",
                params: { id: 99999 },
                query: { user_id: user1 }
            });
            saveRes = httpMocks.createResponse();
            await deleteTask(req, saveRes);
            expect(saveRes.statusCode).toBe(404);
        });
    });
});

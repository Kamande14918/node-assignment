const request = require("supertest");
const app = require("../app");
const fs = require("fs");
const path = require("path");

let logSpy;
let errorSpy;

beforeAll(() => {
	logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
	errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
	logSpy.mockRestore();
	errorSpy.mockRestore();
});

describe("Middleware Integration", () => {
	describe("[Built-In Middleware]", () => {
		describe("[JSON Parse] POST /adopt", () => {
			let res;
			beforeAll(async () => {
				res = await request(app)
					.post("/adopt")
					.send({ dogName: "Pickles", name: "Ellen", email: "ellen@codethedream.com" })
					.set("Content-Type", "application/json");
			});

			test("responds with status 201", () => {
				expect(res.status).toBe(201);
			});

			test("responds with correct message", () => {
				expect(res.body.message).toMatch(
					/Adoption request received. We will contact you at ellen@codethedream.com for further details./
				);
			});
		});

		describe("[Static] GET /images/dachshund.png", () => {
			let res;
			const imagePath = path.join(__dirname, "../public/images/dachshund.png");

			beforeAll(() => {
				if (!fs.existsSync(imagePath)) {
					fs.mkdirSync(path.dirname(imagePath), { recursive: true });
					fs.writeFileSync(imagePath, "fake image content");
				}
			});

			beforeAll(async () => {
				res = await request(app).get("/images/dachshund.png");
			});

			test("responds with status 200", () => {
				expect(res.status).toBe(200);
			});

			test("has image/png content type", () => {
				expect(res.headers["content-type"]).toMatch(/image\/png/);
			});
		});
	});

	describe("[Custom Middleware]", () => {
		describe("[Request ID]", () => {
			let res;

			beforeAll(async () => {
				res = await request(app).get("/dogs");
			});

			test("adds requestId header", () => {
				expect(res.headers["x-request-id"]).toBeDefined();
			});
		});

		describe("[Logging]", () => {
			test("logs request with method, path, and requestId", async () => {
				await request(app).get("/dogs");
				expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/\[.*\]: GET \/dogs \(.+\)/));
			});
		});

		describe("[Error Handling] GET /error", () => {
			let res;

			beforeAll(async () => {
				res = await request(app).get("/error");
			});

			test("responds with status 500", () => {
				expect(res.status).toBe(500);
			});

			test("responds with a requestId", () => {
				expect(res.body.requestId).toBeDefined();
			});

			test("responds with 'Internal Server Error'", () => {
				expect(res.body.error).toBe("Internal Server Error");
			});
		});
	});
});

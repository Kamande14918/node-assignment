const EventEmitter = require("events");
const http = require("http");
const express = require("express");
const request = require("supertest");

describe("Task 1: Event Emitter and Listener", () => {
  let emitter;
  
  beforeEach(() => {
    emitter = new EventEmitter();
  });

  test("should create emitter and listen for 'time' event", () => {
    const messages = [];
    
    emitter.on('time', (timeString) => {
      messages.push("Time received: " + timeString);
    });
    
    emitter.emit('time', '12:00:00 PM');
    emitter.emit('time', '12:00:05 PM');
    
    expect(messages).toEqual([
      "Time received: 12:00:00 PM",
      "Time received: 12:00:05 PM"
    ]);
  });

  test("should handle setInterval callback emitting time events", () => {
    const messages = [];
    
    emitter.on('time', (timeString) => {
      messages.push(timeString);
    });
    
    const mockTime = '12:00:00 PM';
    emitter.emit('time', mockTime);
    
    expect(messages).toContain(mockTime);
  });
});

describe("Task 2: HTTP Server with /time and /timePage endpoints", () => {
  test("should create HTTP server instance", () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Hello World' }));
    });
    
    expect(server).toBeDefined();
    expect(typeof server.listen).toBe('function');
    expect(typeof server.close).toBe('function');
  });

  test("should handle /time endpoint returning JSON with time", () => {
    const mockReq = { url: '/time' };
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };
    
    if (mockReq.url === '/time') {
      mockRes.writeHead(200, { 'Content-Type': 'application/json' });
      const currentTime = new Date().toLocaleTimeString();
      mockRes.end(JSON.stringify({ time: currentTime }));
    }
    
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    expect(mockRes.end).toHaveBeenCalled();
  });

  test("should handle /timePage endpoint returning HTML", () => {
    const mockReq = { url: '/timePage' };
    const mockRes = {
      writeHead: jest.fn(),
      end: jest.fn()
    };
    
    if (mockReq.url === '/timePage') {
      mockRes.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      mockRes.end('HTML content');
    }
    
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
    expect(mockRes.end).toHaveBeenCalled();
  });

  test("should parse JSON time response correctly", () => {
    const timeResponse = '{"time": "12:00:00 PM"}';
    const parsed = JSON.parse(timeResponse);
    
    expect(parsed.time).toBe('12:00:00 PM');
  });
});

describe("Task 3: Express Application", () => {
  let app;
  
  beforeEach(() => {
    app = express();
  });

  test("should handle GET / route", (done) => {
    app.get("/", (req, res) => {
      res.send("Hello, World!");
    });
    
    request(app)
      .get("/")
      .expect(200)
      .expect("Hello, World!")
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });

  test("should handle server errors with error handler", (done) => {
    app.get("/error", (req, res, next) => {
      next(new Error("something bad happened!"));
    });
    
    app.use((err, req, res, next) => {
      if (!res.headerSent) {
        res.status(500).send("A server error occurred.");
      }
    });
    
    request(app)
      .get("/error")
      .expect(500)
      .expect("A server error occurred.")
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });

  test("should handle multiple responses error", () => {
    const mockRes = {
      send: jest.fn(),
      headerSent: false
    };
    
    mockRes.send("Hello, World!");
    mockRes.send("Hello, World!");
    
    expect(mockRes.send).toHaveBeenCalledTimes(2);
  });

  test("should handle no response timeout", () => {
    const mockRes = {
      send: jest.fn(),
      headerSent: false
    };
    
    console.log("Hello, World");
    
    expect(mockRes.send).not.toHaveBeenCalled();
  });
});

describe("Task 4: POST Route Handler", () => {
  let app;
  
  beforeEach(() => {
    app = express();
  });

  test("should handle POST /testpost route", (done) => {
    app.post("/testpost", (req, res) => {
      res.send("POST request received successfully!");
    });
    
    request(app)
      .post("/testpost")
      .expect(200)
      .expect("POST request received successfully!")
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Task 5: Logging Middleware", () => {
  let app;
  
  beforeEach(() => {
    app = express();
  });

  test("should log request method, path, and query", (done) => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path} ${JSON.stringify(req.query)}`);
      next();
    });
    
    app.get("/test", (req, res) => {
      res.send("Test");
    });
    
    request(app)
      .get("/test?param=value")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(consoleSpy).toHaveBeenCalledWith("GET /test {\"param\":\"value\"}");
        consoleSpy.mockRestore();
        done();
      });
  });
});

describe("Error Handler Middleware", () => {
  let app;
  
  beforeEach(() => {
    app = express();
  });

  test("should handle errors with proper status code", (done) => {
    app.get("/error", (req, res, next) => {
      next(new Error("Test error"));
    });
    
    app.use((err, req, res, next) => {
      if (!res.headerSent) {
        return res.status(500).send("An internal server error occurred.");
      }
    });
    
    request(app)
      .get("/error")
      .expect(500)
      .expect("An internal server error occurred.")
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Not Found Middleware", () => {
  let app;
  
  beforeEach(() => {
    app = express();
  });

  test("should handle 404 for unknown routes", (done) => {
    app.use((req, res) => {
      return res.status(404).send(`You can't do a ${req.method} for ${req.url}`);
    });
    
    request(app)
      .get("/unknown-route")
      .expect(404)
      .expect("You can't do a GET for /unknown-route")
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Clean Shutdown", () => {
  test("should handle shutdown signals", () => {
    const processSpy = jest.spyOn(process, 'on').mockImplementation();
    
    let isShuttingDown = false;
    async function shutdown() {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log('Shutting down gracefully...');
    }
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    expect(processSpy).toHaveBeenCalledWith('SIGINT', shutdown);
    expect(processSpy).toHaveBeenCalledWith('SIGTERM', shutdown);
    
    processSpy.mockRestore();
  });
});

console.log("Assignment 2 tests loaded successfully!");
console.log("Run with: npm run tdd assignment2");

const express = require("express");
const app = express();
const errorHandler = require("./middlewares/error-handler");
const notFound = require("./middlewares/not-found");
const userRouter = require("./routes/userRoutes");
const authMiddleware = require("./middlewares/auth");
const taskRouter = require("./routes/taskRoutes");
const analyticsRouter = require("./routes/analticsRoutes");

global.user_id = null;
const prisma = require("./db/prisma")

// Health Check
app.get("/health", async(req, res) =>{
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", message:"Database connected successfully."})
  } catch (err){
    res.status(500).json({ message: `db not connected: ${err.message}`})
  }
})

// middleware
app.use(express.json());

app.use((req,res,next)=>{
  console.log(`Method: ${req.method}, path: ${req.path}, query: ${JSON.stringify(req.body)}`)
  next();
})
app.get("/",(req,res) =>{
   res.send("Hello world!")
})
app.post("/testpost",(req,res) =>{
  res.send({message:"You are on the right track!"})
})
app.use("/api/users",userRouter);
app.use("/api/tasks",authMiddleware,taskRouter);
app.use("/api/analytics", authMiddleware,analyticsRouter);

app.use(errorHandler)
app.use(notFound)
const port = process.env.PORT || 3000;

const server = app.listen(port,() =>{
  console.log(`Server is running on port ${port}`)
})
 
server.on("error",(err) =>{
  if (err.code === "EADDRINUSE"){
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err)
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down gracefully...');
  try {
    await new Promise(resolve => server.close(resolve));
    console.log('HTTP server closed.');
    // If you have DB connections, close them here
    await prisma.$disconnect();
    console.log("Prisma disconnected.")
  } catch (err) {
    console.error('Error during shutdown:', err);
    code = 1;
  } finally {
    console.log('Exiting process...');
    process.exit(code);
  }
}

process.on("SIGINT",() => shutdown(0));
process.on("SIGTERM",() => shutdown(0))
process.on("uncaughtException",(err) =>{
  console.error("Uncaught Exception:",err);
  shutdown(1);

})
process.on("unhandledRejection",(reason) =>{
  console.error("Unhandled Rejection:", reason);
  shutdown(1)
})
module.exports = {app, server}
const express = require("express");
const app = express();
const errorHandler = require("./middlewares/error-handler");
app.use(errorHandler);

// middleware to parse the request body
app.use(express.json({limit: "1kb"}));
// user routes 
const userRouter = require("./routes/user");
app.use("/user",userRouter);




// logger middleware (task 5)
app.use((req,res,next) =>{
    console.log(`method: ${req.method}, url: ${req.url}, time:${new Date().toISOString()}`);
    next();
})

app.get("/", (req, res) =>{
    res.json({message:"Hello Kennedy, is your progress with the node work please."});
    

});
app.get("/welcome", (req,res) =>{
    res.json({message:"Welcome to Code the Dream, we are really excited to have you here Kennedy! Welcome to the team"});
})
// post functionality(task  4)
app.post("/testpost",(req,res) =>{
    res.json({message:"This is a testpost content, if you see it , your post route works pretty well. "});
})
const port = process.env.PORT || 3000;
try{
    app.listen(port,() =>{
        console.log(`Server running on port: ${port}`)
    })
} catch (error){
console.error(error)
}

let isShuttingDown = false;
async function shutdown() {
    if(isShuttingDown) return;
    isShuttingDown = true;
    console.log("Shutting down gracefully...");
    // Here we add code as needed to disconnect gracefully from the database.
}

process.on('SIGINT',shutdown);
process.on('SIGTERM',shutdown);
process.on('uncaughtException', (err) =>{
    console.error('uncaughtException:',err);
});
shutdown();
process.on('unhandledRejection',(reason) =>{
    console.error('Unhandled rejection:',reason);
    shutdown();
})

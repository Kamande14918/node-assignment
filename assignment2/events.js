const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("time",(message) =>{
    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2,"0");
    const minutes = currentTime.getMinutes().toString().padStart(2,"0");
     console.log(`Time received: ${hours}:${minutes}, Message: ${message}`);
})
setInterval(() =>{
    emitter.emit("time","8am is the time to go to the hospital!");
},10000);

emitter.on("error", (error) =>{
    console.log("The emitter responded with an error",error.message);
})

emitter.emit("time","What time am I really going to the hospital?")
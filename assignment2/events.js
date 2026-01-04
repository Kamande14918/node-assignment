const Eventemitter = require('events');
const emitter = new Eventemitter();
const waitForEvent =  () =>{
    return new Promise((resolve) =>
    {
        emitter.on('happens',(msg) =>{
            resolve(msg)
        })

    })

}

const result = async () =>{
    const message = await waitForEvent();
    console.log(message);
}
result();
emitter.emit('happens',"Hello today");


// Log __dirname and __filename
console.log("__dirname:",__dirname);
console.log("__filename:",__filename);


// Log process ID and platform
console.log("Process ID:",process.pid);
console.log("Platform:",process.platform);


// Attach a custom property to global and log it
const myGlobal ={appName:"Global Demo", version:"1.0.0"};
global.myGlobal = myGlobal;
console.log("Global Property:",global.myGlobal);
// console.log("Hello, Kennedy Kamau Kamande , welcme to CTD Node curiculum review");
// console.log(`The script name is ${process.argv[1]}`);
// console.log(`The module is ${module.id}`);

// const obj = {a: 1, b:2, c:3};
// obj.a = 10;
// console.log(obj)
const fs = require('fs');
const doFileOperations = async () => {

    fileHandle = await  new Promise((resolve, reject) => {
        fs.open('myfile.txt', 'w', (err, fileHandle) => {
            return err ? reject(err) : resolve(fileHandle);
        });
    });

};
 try {
    doFileOperations();
 } catch (err){
    console.error(err);
 }
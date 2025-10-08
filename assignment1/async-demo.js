const fs = require("fs").promises;

async function readFile(filePath){
    try {
        const data = await fs.readFile(filePath,"utf8");
        console.log("File content:", data);
    } catch (error){
        console.error("Error reading file:", error);
    }
}
readFile("myfile.txt");
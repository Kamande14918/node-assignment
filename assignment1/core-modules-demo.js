const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log("Operating  system info:",{
  platform: os.platform(),
  cpuCores: os.cpus().length,
  freeMemory: os.freemem(),
  totalMemory: os.totalmem(),
  homeDir: os.homedir(),
  uptime: os.uptime()
})


// Path module
const filePath1 = path.join(__dirname,"myfile.txt");
console.log("File path info:",{
  dir: path.dirname(filePath1)
})


// fs.promises API
const  fileOperations = () => {
  try {
    const filePath = path.join(__dirname,"kendemo.js");
    const content = "My main goal is to use code the dream to help me master and teach coding skills. After this I want to use this experience to grow my own business and help others do the sam. I have been lying to myself that I know programming until now, but I am really greatful that I identified the issues and took a bold step to fix it. I am ready to work hard and make my dreams come true. I am ready to be grateful to the opportunities that come my way. I am ready to be a blessing to others. I am ready to be the best version of myself. I am ready to be great. I am ready to be successful. I am ready to be happy. I am ready to be free. I am ready to be me."
    // Create and write to a file
    fs.promises.writeFile(filePath,content,"utf-8");
    console.log("File written successfully");

    // Read the file
    fs.promises.readFile(filePath,"utf-8")
    .then(data => {
      console.log("File content:", data);
})
    
  } catch (error){
    console.error("File operation error:", error);
  }
}
fileOperations();
// Streams for large files- log first 40 chars of each chunk

//  first writting huge contents to the largefile.txt
const largeFilePath = path.join(__dirname,"sample-files","largefile.txt");
async function writeContent(){
  const largeContent = "My name is Kennedy Kamau Kamande. I am a mentor at the code the dream school where my role is to help students learn programming skills. I am also a final year student at the Jomo Kenyatta University of Agriculture and Technology pursuing BSc Electronic and Engineering. I have a strong passion for technology and I love to learn new things. I am a hardworking person and I am always willing to help others. I believe that with hard work and determination, anything is possible. I am looking forward to a successful career in the technology industry and I am excited about the opportunities that lies ahead. I am also a team player and I enjoy working with others to achieve a common goal. I believe that together we can achieve great things. I am grateful to the opportunities that  I have been given and I am determined to make the most out of them. I am ready to take new challenges and I am excited about the future.";

  const filedata = await fs.promises.writeFile(largeFilePath, largeContent.repeat(10000), "utf-8");
  console.log("large file written successfully");
  
  return filedata;

}
writeContent();
// then reading the largefile.text and logging the first 40 chars of each chunk
const readLargeFile = () => {
  const readStream = fs.createReadStream(largeFilePath,{
    encoding:"utf-8",
    heighWaterMark: 1024, //1KB chunk size
});
readStream.on("data", (chunk) => {
  console.log("Chunk received:", chunk.slice(0,40));// log first 40 chars of each chunk
  console.log("Finished reading large file  with streams")

})
}
readLargeFile();

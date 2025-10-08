
const htmlString = `

Clock
Get the Time
<script> document.getElementById('getTimeBtn').addEventListener('click', async () => { const res = await fetch('/time'); const timeObj = await res.json(); console.log(timeObj); const timeP = document.getElementById('time'); timeP.textContent = timeObj.time; }); </script> `; 
const http = require('http');

const server = http.createServer({keepAliveTimeout: 60000},(req,res) =>{
    if(
        req.method === "GET" &&
        req.url ==="/" &&
        req.headers["content-type"] === "application/json"
    ){
        let body ="";
        req.on("data", (chunk) => (body += chunk)); //This is how you assemble the body
        req.on("end",() =>{
            // this event is emitted when the body is completely assembled. If there isn't a body , it is emitted when the request arrives.
            const parsedBody = JSON.parse(body);
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify({
                weReceived: parsedBody,
            }),
        );
        });
    } else if (req.method != "GET"){
        res.writeHead(404,{"Content-type":"application/json"});
        res.end(JSON.stringify({
            message:"The route is not available."
        }),
    );
    } else if(req.url.pathname ==="/secret"){
        res.writeHead(200,{"Content-type":"application/json"});
        res.end(JSON.stringify({
            message:"The secret word is 'swordfish'.",
        }),
    );
    } 
    //  else if(req.url.pathName ==="/time"){
    //     const currentTime = new Date();
    //     const hours = currentTime.getHours().toString().padStart(2,"0");
    //     const minutes = currentTime.getMinutes().toString().padStart(2,"0");
    //     res.writeHead(200,{"content-type":"text/html",charset:"utf-8"});
    //     res.end(JSON.stringify({
    //         time:`${hours}:${minutes}`,
    //         html:htmlString,

    //     }))

    //  }
    else {
        res.writeHead(200,{"Content-Type":"application/json"});
        res.end(JSON.stringify({
            pathEntered: req.url,
        }),
    );
    }
});

server.listen(3000);
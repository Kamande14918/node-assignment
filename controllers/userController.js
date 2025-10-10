const { storedUsers, setLoggedOnUser} = require("../util/memoryStore");

function register(req, res){
  const newUser = {...req.body};
  storedUsers.push(newUser); // this makes a copy
  setLoggedOnUser(newUser); //After register 
   delete req.body.password;
   res.status(201).json(newUser);
   
}

function logon(req, res){
    const {email, password} = req.body;
    const existingUser = storedUsers.find((user) => user.email === email);
    if(!existingUser){
        res.status(401).json({message:"User does not exist"});
    } else 
    if(existingUser.password !== password){
        res.status(401).json({message:"Authentication failed."});
    } else {
        res.status(200).json({message:existingUser.name})
    }
}

function logoff(req,res){
   setLoggedOnUser(null);
   res.status(200).json({message:"User logged off successfully"});

}
  
module.exports = { register, logon,logoff};
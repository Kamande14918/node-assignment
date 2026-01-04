const {StatusCodes} = require("http-status-codes");

function register(req,res){
  const newUser ={...req.body};
  global.users.push(newUser);
  global.user_id = newUser; //After registration the user is set to logged in
  delete req.body.password;
  res.status(StatusCodes.CREATED).json(req.body)
}
function logon(req,res){
  const user = global.users.find((u)=> u.email === req.body.email && u.password === req.body.password);
  if(!user){
    return res.status(StatusCodes.UNAUTHORIZED).json({message:"Invalid email or password"});
  } else{
    global.user_id = user; // the user is set to logged on
    return res.status(StatusCodes.OK).json({name: user.name,email:user.email})
  }
}
function logoff(req,res){
  global.user_id = null; //user is logged off
  return res.status(StatusCodes.OK).json({message:"User logged off successfully"})
}

module.exports = {
  register,
  logon,
  logoff
};
const {StatusCodes} = require("http-status-codes");
const userSchema = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const prisma = require("../db/prisma");
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
async function register(req, res, next){
  if(!req.body) req.body ={};
  const {error, value} = userSchema.validate(req.body);
  if(error){
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation error",
      details: error.details
    })
  }

  value.hashedPassword = await hashPassword(value.password);
  const { name, email, hashedPassword} = value;
  let user;
  try {
    user = await prisma.user.create({
      data:{
        name,
        email,
        hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    global.user_id = user.id;
    
    return res.status(StatusCodes.CREATED).json({user: {id: user.id, name: user.name, email: user.email}, });


  } catch(err){
    if(err.name === "PrismaClientKnownRequestError" && err.code === "P2002"){
      return res.status(StatusCodes.CONFLICT).json({message:"User with this email already exists."})
    } 
    else {
      return next(err);
    }
    
  }
}

async function logon(req,res){
  if(!req.body) req.body ={};

  const {email, password} = req.body;
  if(!email || !password){
    return res.status(StatusCodes.BAD_REQUEST).json({message:"Email and password are required."})
  }

  try{
    const user = await prisma.user.findUnique({
      where: {email},
      select:{
        id: true,
        name: true,
        email: true,
        hashedPassword: true
      }
    });
    if(!user){
      return res.status(StatusCodes.UNAUTHORIZED).json({message:"Invalid email or password"})
    }
    const isPasswordValid = await comparePassword(password, user.hashedPassword);
    if(!isPasswordValid){
      return res.status(StatusCodes.UNAUTHORIZED).json({message:"Invalid email or password"})
    }
     global.user_id = user.id;
     const {hashedPassword, ...sanitizedUser} = user;
     return res.status(StatusCodes.OK).json({user: sanitizedUser})
  } catch(err){
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message:"An error occurred during logon.", error: err.message})
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
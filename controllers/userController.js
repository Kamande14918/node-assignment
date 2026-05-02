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
   // Remove plain password from the value
   delete value.password;
   try{
    const result = await prisma.$transaction(async (tx)=>{
      // create user account 
      const newUser = await tx.user.create({
        data:{name, email, hashedPassword},
        select:{id: true, name: true, email: true}
      });
      // create three welcome tasks using createMany
    const welcomeTaskData =[
      {title:"Complete your profile",userId: newUser.id, priority:"medium"},
      {title:"Add your first task", userId: newUser.id, priority:"High"},
      {title:"Explore the app", userId: newUser.id, priority:"low" }
    ];

   await tx.task.createMany({
    data: welcomeTaskData
   })

  //  Fetch the created tasks to return them
    const welcomeTasks = await tx.task.findMany({
      where: {userId: newUser.id},
      select:{
        id: true,
        title: true,
        isCompleted: true,
        userId: true,
        priority: true
      }
    });
    return {user: newUser, welcomeTasks}
    });

    // Store the user ID globally for the session management 
    global.user_id = result.user.id
    
     res.status(StatusCodes.CREATED).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success"
     })
     return;
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

async function show(req,res){
  const userId = parseInt(req.params.id);
  if(isNaN(userId)){
    return res.status(StatusCodes.BAD_REQUEST).json({message:"The user ID passed is not valid."})
  }
  try{
    const user = await prisma.user.findUnique({
      where: { id: userId},
      select:{
        id: true,
        name: true,
        email: true,
        createdAt: true,
        Tasks: {
          select: {
            id: true,
            title: true,
            isCompleted: true,
            priority: true,
            createdAt: true
          },
          take: 5,
          orderBy: {createdAt: "desc"}
        }
      }
    });
    if(!user){
      return res.status(StatusCodes.NOT_FOUND).json({message:"User not found."})
    }
    res.json({user});
  } catch(err){
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message:"An error occurred while fetching user details.", error: err.message})
  }
}

function logoff(req,res){
  global.user_id = null; //user is logged off
  return res.status(StatusCodes.OK).json({message:"User logged off successfully"})
}

module.exports = {
  register,
  logon,
  show,
  logoff
  
};
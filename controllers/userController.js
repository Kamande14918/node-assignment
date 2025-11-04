const userSchema = require('../validation/userSchema').userSchema;
const crypto = require('crypto');
const { PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
//Register a new user
exports.register= async (req,res) =>{
  try{
  const {error, value} = userSchema.validate(req.body,{abortEarly: false});
  if(error){
    return res.status(400).json({message: "Validation failed", 
      details: error.details});
  }
    const { name, email, password} = value;
    // guard: if the Prisma client doesn't have a `users` model (no introspection/generation),
    // return a clear error instead of a TypeError.
    if (!prisma.users) {
      return res.status(500).json({
        error: "Prisma model 'users' not found",
        message: "Run `npx prisma db pull --schema=prisma/schema.prisma` to introspect your database or define a users model in prisma/schema.prisma, then run `npx prisma generate`."
      });
    }
    const existingUser = await prisma.users.findUnique({
      where: { email }
    }) 
    if(existingUser){
      return res.status(409).json({message:"User already exists"});
    }
    const hashedPassword = crypto.scryptSync(password, 'salt',64).toString('hex');
    // return the inserted id so we can respond with it
    const newUser =  await prisma.users.create({
      data:{
        email, name, hashedpassword: hashedPassword
      },
      select:{ id: true, email: true, name: true}
    });

    //store the user id globally for session management
    global.user_id = newUser.id;

    return res.status(201).json({message:"User registered successfully"});
} catch(err){
    return res.status(500).json({error: err.message});
}
}

exports.login = async (req, res) =>{
  try{
    const { email, password} = req.body;
    if (!prisma.users) {
      return res.status(500).json({
        error: "Prisma model 'users' not found",
        message: "Run `npx prisma db pull --schema=prisma/schema.prisma` to introspect your database or define a users model in prisma/schema.prisma, then run `npx prisma generate`."
      });
    }

    const user = await prisma.users.findUnique({
      where: { email }
    });
    if(!user){
      return res.status(401).json({message:"Invalid credentials"});
    }
    const hashedInputPassword = crypto.scryptSync(password,'salt',64).toString('hex');
   const isPasswordValid = hashedInputPassword === user.hashedpassword;
    if(!isPasswordValid){
      return res.status(401).json({message:"Invalid credentials"});
    }
    global.user_id = user.id;

    return res.status(200).json({
      message:"Login successful",
      user: {id: user.id, email: user.email, name: user.name}});
  }  catch(err){
    console.error(err)
    res.status(500).json({error:"Internal server error"});
  }
}

exports.logoff = async (req, res) =>{
  try{
    global.user_id = null;
    return res.status(200).json({message:"User logged off successfully"});
  } catch(err){
    res.status(500).json({error: err.message});
  }
}
const userSchema = require('../validation/userSchema').userSchema;
const crypto = require('crypto');
const pool = require('../db');
//Register a new user
exports.register= async (req,res) =>{
  const {error, value} = userSchema.validate(req.body,{abortEarly: false});
  if(error){
    return res.status(400).json({message: "Validation failed", 
      details: error.details});
  }
    const { name, email, password} = value;
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1',[email]);
    // pool.query always returns a result object; check rows length to see if a user exists
    if(existingUser.rows && existingUser.rows.length > 0){
      return res.status(409).json({message:"User already exists"});
    }
    const hashedPassword = crypto.scryptSync(password, 'salt',64).toString('hex');
    // return the inserted id so we can respond with it
    const result = await pool.query('INSERT INTO users (name, email, hashedPassword) VALUES ($1, $2, $3) RETURNING id',[name, email, hashedPassword]);

    // result.rows should contain the new id when RETURNING is used
    if(result.rows && result.rows[0]){
      global.user_id = result.rows[0].id;
      return res.status(201).json({message:"User registered successfully", id: result.rows[0].id});
    }
    // fallback if INSERT didn't return an id
    return res.status(201).json({message: "User registered successfully"});
}

exports.login = async (req, res) =>{
  try{
    const { email, password} = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1',[email]);
    if(!user.rows || user.rows.length === 0){
      return res.status(401).json({message:"Invalid credentials"});
    }
    const hashedInputPassword = crypto.scryptSync(password,'salt',64).toString('hex');
    console.log(hashedInputPassword);
    console.log(user.rows[0].hashedpassword);
    const isPasswordValid = hashedInputPassword === user.rows[0].hashedpassword;
    if(!isPasswordValid){
      return res.status(401).json({message:"Invalid credentials"});
    }
    global.user_id = user.rows[0].id;
    return res.status(200).json({message:"Login successful"});
  }  catch(err){
    res.status(500).json({error: err.message});
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
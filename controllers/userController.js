const {StatusCodes} = require("http-status-codes");
const userSchema = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const pool = require("../db/pg-pool");
;

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
async function register(req,res){
  if(!req.body) req.body = {};
  const {error, value} = userSchema.validate(req.body,{abortEarly: false});
  if(error){
    return res.status(StatusCodes.BAD_REQUEST).json({message:error.message});
  }
  try{
    const {name, email, password} = value;
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if(existingUser.rows.length > 0){
      return res.status(StatusCodes.CONFLICT).json({message:"User with this email already exists"});
    }
    const hashed_password = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (name, email, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, name`, [name, email,hashed_password]
    );
    const user = result.rows[0];
    const {hashed_password1:_, ...sanitizedUser} = user;
    return res.status(StatusCodes.CREATED).json({user: sanitizedUser});
  } catch(err){
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: err.message})
  }
}

async function logon(req, res){
  if(!req.body) req.body = {};
  try {
    const {email, password} = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if(result.rows.length === 0){
      return res.status(StatusCodes.UNAUTHORIZED).json({message:"Invalid email or password"});
    }
    const hashedPassword  = result.rows[0].hashed_password;
    const isPasswordValid = await comparePassword(password, hashedPassword);
    if(!isPasswordValid){
      return res.status(StatusCodes.UNAUTHORIZED).json({message:"Invalid email or password"});
    }
    global.user_id = result.rows[0].id;
    const {hashed_password:_, ...sanitizedUser} = result.rows[0];
    return res.status(StatusCodes.OK).json({
      user: sanitizedUser
    })
  }catch(err){
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: err.message});
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
const {StatusCodes} = require("http-status-codes");
const {taskSchema, patchTaskSchema} = require("../validation/taskSchema");
const pool = require("../db/pg-pool");


async function create(req,res){
  if(!req.body) req.body={}
  const {error, value} = taskSchema.validate(req.body,{abortEarly: false});
  if(error){
    return res.status(StatusCodes.BAD_REQUEST).json({message:error.message});
  }

   const task= await pool.query(`INSERT INTO tasks (title,is_completed,user_id) VALUES ($1, $2, $3) RETURNING id,title,is_completed`, [value.title,value.isCompleted,global.user_id])
    res.status(StatusCodes.CREATED).json({message:"Task created successfully", task: task.rows[0]});
}
async function index(req, res){
 
   const tasks = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1", [global.user_id]);
   if(tasks.rows.length === 0){
    return res.json({message:"No tasks found for this user."})
   }
   res.json({tasks: tasks.rows});
}

async function update(req,res){
  if(!req.body) req.body={}
  const {error, value} = patchTaskSchema.validate(req.body,{abortEarly: false});
  if(error){
    return res.status(StatusCodes.BAD_REQUEST).json({message:error.message});
  }
  const taskChange = value;
  let keys = Object.keys(taskChange);
  keys= keys.map((key)=> key === "isCompleted"? "is_completed": key);
  const setClauses = keys.map((key,i)=> `${key} = $${i+1}`).join(",");
  const idParam = `$${keys.length + 1}`;
  const userParam = `$${keys.length + 2}`;
  const updatedTask = await pool.query(`UPDATE tasks SET ${setClauses} WHERE id = ${idParam} AND user_id = ${userParam}  RETURNING id, title, is_completed`,[...Object.values(taskChange), req.params.id, global.user_id])
res.json({message:"Task updated successfully", task: updatedTask.rows[0]});
}
 async function show(req,res){
  const taskToFind = parseInt(req.params?.id);
  if(!taskToFind){
    return res.status(StatusCodes.BAD_REQUEST).json({message:"The task ID passed is not valid."});
  }
  const task = await pool.query("SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2", [taskToFind,global.user_id]);
  if(task.rows.length === 0){
    return res.status(StatusCodes.NOT_FOUND).json({message:"Task not found."})
  }
  res.json({task: task.rows[0]})

}

async function deleteTask(req,res){
  const taskToFind = parseInt(req.params?.id);
  if(!taskToFind){
    return res.status(StatusCodes.BAD_REQUEST).json({message:"The task ID passed is not valid."})
  }
  
  const deletedTask = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed", [taskToFind,global.user_id]);
  if(deletedTask.rows.length === 0){
    return res.status(StatusCodes.NOT_FOUND).json({message:"Task not found."})
  }
  res.json({message:"Task deleted successfully", task: deletedTask.rows[0]});
}

module.exports = {
  create,
  index,
  update,
  show,
  deleteTask
}
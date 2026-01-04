const {StatusCodes} = require("http-status-codes");
const taskCounter = (() =>{
  let lastTaskNumber = 0;
  return () =>{
    lastTaskNumber += 1;
    return lastTaskNumber;
  }
})();

function create(req,res){
  const newTask = {...req.body, id: taskCounter(), userId:global.user_id.email};
  global.tasks.push(newTask);
  const {userId,...saniTizedTask} = newTask;
  res.json(saniTizedTask);
}

function index(req, res){

  const userTasks = global.tasks.filter((t) => t.userId ===global.user_id.email);
  const sanitizedTasks = userTasks.map((task) =>{
    const {userId,...sanitizedTask} =task
    return sanitizedTask;
  })
  res.json(sanitizedTasks);
}

function update(req,res){
   const taskToFind = parseInt(req.params?.id);
   if(!taskToFind){
    return res.status(StatusCodes.BAD_REQUEST).json({message:"The task ID passed is not valid."});
   }
   const taskIndex = global.tasks.findIndex((t) => t.id ===taskToFind && t.userId === global.user_id.email);
   if(taskIndex === -1){
    return res.status(StatusCodes.NOT_FOUND).json({message:"Task not found."})
   }
   Object.assign(global.tasks[taskIndex],req.body);
   const {userId,...sanitizedTask} = global.tasks[taskIndex];
   res.json(sanitizedTask);
     
}
function show(req,res){
  const taskToFind = parseInt(req.params?.id);
  if(!taskToFind){
    return res.status(StatusCodes.BAD_REQUEST).json({message:"The task ID passed is not valid."});
  }
  const task = global.tasks.find((t) => t.id ===taskToFind && t.userId === global.user_id.email);
  if(!task){
    return res.status(StatusCodes.NOT_FOUND).json({message:"Task not found"})
  }  else{
    const { userId, ...sanitizedTask} = task;
    res.json(sanitizedTask);
  }

}

function deleteTask(req,res){
  const taskToFind = parseInt(req.params?.id);
  if(!taskToFind){
    return res.status(StatusCodes.BAD_REQUEST).json({message:"The task ID passed is not valid."})
  }
  
  const taskIndex = global.tasks.findIndex((t) => t.id === taskToFind && t.userId === global.user_id.email);
  if(taskIndex === -1){
    return res.status(StatusCodes.NOT_FOUND).json({message:"Task not found."})
  }
  
  const task ={ user_id, ...global.tasks[taskIndex]} //make a copy without userId
  global.tasks.splice(taskIndex,1);
  res.json({message:"Task deleted successfully.",task})
}

module.exports = {
  create,
  index,
  update,
  show,
  deleteTask
}
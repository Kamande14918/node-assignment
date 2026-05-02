const {StatusCodes} = require("http-status-codes");
const {taskSchema, patchTaskSchema} = require("../validation/taskSchema");
const prisma = require("../db/prisma");


async function create(req, res){
  if(!req.body) req.body  = {};
  const {error, value} = taskSchema.validate(req.body);
  if(error){
    return res.status(StatusCodes.BAD_REQUEST).json({message: error.message});
  }
  const task = await prisma.task.create({
    data: {title: value.title, isCompleted: value.isCompleted, priority: value.priority,userId: global.user_id},
    select:{id: true, title: true, isCompleted: true, priority: true}
  })
  res.status(StatusCodes.CREATED).json({task: task});
}

async function index(req, res){
  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;


//  Build where clause with optional search filter
const whereClause ={userId: global.user_id};
if(req.query.find){
  whereClause.title ={
    contains: req.query.find, //Matches %find% pattern
    mode:"insensitive"   //Case insensitive search(ILIKE in PostgreSQL)
  };
}
const getOrderBy = (query) =>{
  const validSortFields =["title","priority","createdAt","id","isCompleted"];
  const sortBy = query.sortBy || "createdAt";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  if(validSortFields.includes(sortBy)){
    return {[sortBy]: sortDirection};
  }
  return {createdAt: "desc"}; //Default fallback
}

  // Get tasks with pagination and eager loading
  //Use where clause in your findMany query
  const tasks = await prisma.task.findMany({
    where: whereClause,
    select:{
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User:{
        select: {
          name: true,
          email: true
        }
      }
    },
      skip: skip,
      take: limit,
      orderBy: getOrderBy(req.query)
    
  })

  // Get total count for pagination metadata
  const totalTasks = await prisma.task.count({
    where: whereClause
  });

  // Build pagination object with complete metadata
  const pagination ={
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page >1
  }
  if(tasks.length === 0){
    return res.status(StatusCodes.NOT_FOUND).json({message:"No tasks found for this user."})
  }
  res.json({tasks, pagination});
}

async function update(req,res, next){
  if(!req.body) req.body={}
  const {error, value} = patchTaskSchema.validate(req.body,{abortEarly: false});
  if(error){
    return res.status(StatusCodes.BAD_REQUEST).json({message:error.message});
  }
  try{
     const id = parseInt(req.params.id);
      if(isNaN(id)){
        return res.status(StatusCodes.BAD_REQUEST).json({message:"The task ID passed is not valid."})
      }

    const task = await  prisma.task.update({
      data: value,
      where:{
        id,
        userId: global.user_id
      },
      select: {id: true, title: true, isCompleted: true, priority: true}
    })
    res.json({task})
  } catch(err){
    if(err.code === "P2025"){
      return res.status(StatusCodes.NOT_FOUND).json({message:"The task was not found."})
    } else {
      return next(err);
    }
  }
}
 async function show(req,res, next){
  const id = parseInt(req.params.id);
  if(isNaN(id)){
    return res.status(StatusCodes.BAD_REQUEST).json({message:"The task ID passed is not valid."})
  }
  try {
    const task = await  prisma.task.findUnique({
      where: {
        id,
        userId: global.user_id
      },
      select: {id: true, title: true, isCompleted: true, priority: true}
    })
    res.json(task);
  } catch(err){
    if(err.code ==="P2025"){
      return res.status(StatusCodes.NOT_FOUND).json({message:"The task was not found."});
    }  else {
      return next(err);
    }
  }
}


// Bulk task creation
async function bulkCreate(req, res,next){
  const {tasks} = req.body;

  // Validate the tasks array
  if(!tasks | !Array.isArray(tasks) || tasks.length === 0){
    return res.status(StatusCodes.BAD_REQUEST).json({error:"Invalid request data. Expected an array of tasks."});
  }
  // Validate all tasks before insertion
   const validTasks = [];
   for(const task of tasks){
    const {error, value} = taskSchema.validate(task);
    if(error){
      return res.status(StatusCodes.BAD_REQUEST).json({
        error:"Validation failed",
        details: error.details
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted,
      priority: value.priority,
      userId: global.user_id
    });
   }
  //  Use createMany for bulk insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });
    res.status(StatusCodes.CREATED).json({
      message:"success",
      tasksCreated: result.count,
      totalRequested: validTasks.length
    });
  } catch(err){
    return next(err);
  }
}

async function deleteTask(req,res, next){
  const id  =  parseInt(req.params.id);
  if(isNaN(id)){
    return  res.status(StatusCodes.BAD_REQUEST).json({message:"The task ID passed is not valid."});
  }
  try {
    const task = await prisma.task.delete({
      where: {
        id,
        userId: global.user_id
      },
      select: {id: true, title: true, isCompleted: true, priority: true}
    })
    res.json({message: "Task deleted successfully", task});
  } catch(err) {
    if(err.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({message: "The task was not found."});
    } else {
      return next(err);
    }
  }
}

module.exports = {
  create,
  index,
  update,
  show,
  bulkCreate,
  deleteTask
}
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
    data: {title: value.title, isCompleted: value.isCompleted, userId: global.user_id},
    select:{id: true, title: true, isCompleted: true}
  })
  res.status(StatusCodes.CREATED).json({task: task});
}

async function index(req, res){
  const tasks = await prisma.task.findMany({
    where: {userId: global.user_id},
    select: {id: true, title: true, isCompleted: true}
  });
  res.json({tasks})
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
      select: {id: true, title: true, isCompleted: true}
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
      select: {id: true, title: true, isCompleted: true}
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
      select: {id: true, title: true, isCompleted: true}
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
  deleteTask
}
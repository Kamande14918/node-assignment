const { PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient({
  // fixed typo: 'quey' -> 'query'
  log: ['query', 'info', 'warn', 'error']
});
const {taskSchema, patchTaskSchema} = require('../validation/taskSchema');


exports.index = async (req, res) =>{
   try{
         const result = await prisma.tasks.findMany({
          where: { user_id: global.user_id}
         })
     
       if(!result || result.length === 0){
        return res.status(404).json({message:"No tasks found for user"});
       }
       res.status(200).json(result);
   } catch(err){
       return res.status(500).json({error: err.message})
   }
}

exports.show = async (req, res) =>{
    try{
      const { id } = req.params;
        const parsedId = parseInt(id, 10);
        if (Number.isNaN(parsedId)) {
          return res.status(400).json({ message: 'Invalid id' });
        }

        const result = await prisma.tasks.findFirst({
          where: { id: parsedId, user_id: global.user_id }
        });

        if (!result) {
          return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(result);
    } catch(err){
      return res.status(500).json({error: err.message});
    }
}

exports.create = async (req, res) =>{
  try{
    const {error, value} = taskSchema.validate(req.body);
    if(error){
      return res.status(400).json({
        error: "Validation failed",
        details: error.details
      })
    }
    const { title, isCompleted = false} = value;
    
    const result = await prisma.tasks.create({
      data: {
         title,
         is_completed: isCompleted,
         user_id: global.user_id
      }
    })

    res.status(201).json(result);
  } catch(err){
    return res.status(500).json({error: err.message})
  }
}

exports.update = async (req, res) =>{
  try{
  const { id } = req.params;
  const { error, value } = patchTaskSchema.validate(req.body);
    if(error){
      return res.status(400).json({
        error: "Validation failed",
        details: error.details
      })
    }
    
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    // ensure the task belongs to the logged-in user
  const existing = await prisma.tasks.findFirst({ where: { id: parsedId, user_id: global.user_id } });
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, isCompleted } = value;
    const data = {};
    if (title !== undefined) data.title = title;
    if (isCompleted !== undefined) data.is_completed = isCompleted;

    const result = await prisma.tasks.update({
      where: { id: parsedId },
      data
    });

    res.status(200).json(result);
  } catch(err){
    return res.status(500).json({error: err.message})
  }
}

exports.deleteTask = async (req, res) =>{
  try{
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    // delete only if the task belongs to the logged-in user
    const deleteResult = await prisma.tasks.deleteMany({
      where: { id: parsedId, user_id: global.user_id }
    });

    if (deleteResult.count === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch(err){
    return res.status(500).json({error: err.message});
  }
}
const {StatusCodes} = require("http-status-codes")
const prisma = require("../db/prisma");

const    analytics = async (req, res) =>{
    const userId = parseInt(req.params.id);
    if(isNaN(userId)){
        return res.status(StatusCodes.BAD_REQUEST).json({
            message:"The user ID passed is not valid"
        });
    }
    const user = await prisma.user.findUnique({
        where:{id: userId},
        select:{id: true, name: true, email: true}
    })
    if(!user){
        return res.status(StatusCodes.NOT_FOUND).json({
            message:"User not found."
        })
    }
    // use groupBy to count tasks by completion status
    const taskStats = await prisma.task.groupBy({
        by:["isCompleted"],
        where:{userId: userId},
        _count:{id: true},
    });
    // Include recent task activity with eager loading
    const recentTasks = await prisma.task.findMany({
        where:{userId: userId},
        select:{
            id: true,
            title: true,
            isCompleted: true,
            priority: true,
            createdAt: true,
            userId: true,
            User:{
                select:{name: true}
            }
        },
        orderBy:{createdAt: "desc"},
        take: 10
    })
    // Calculate weekly progress using groupBy
    //First calculate the date from one week ago
    // Hint: Use new Date() and setDate() to subtract 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyProgress = await prisma.task.groupBy({
        by:['createdAt'],
        where:{
            userId,
            createdAt: {gte: oneWeekAgo}
        },
        _count:{id: true}
    })
    // Return the response with taskStats, recentTasks, and weeklyProgress
    res.json({
        taskStats,
        recentTasks,
        weeklyProgress
    })
}
const users= async(req,res) =>{
    // parse pagination parameters
    const page = parseInt(req.query.page) ||1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    // Get users with task count using _count aggregation
    const usersRaw = await prisma.user.findMany({
        include:{
            Task: {
                where:{ isCompleted: true},
                select:{id: true},
                take: 5,
            },
            _count:{
                select:{
                    Task: true
                }
            }
        },
        skip: skip,
        take: limit,
        orderBy:{ createdAt: "desc"}
    })
    // Note in prisma, you need to use include for relations, then transform the result

    // Transform to only include the fields we want
    const users = usersRaw.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        _count: user._count,
        Task: user.Task
    }));


    // Get total count for pagination metadat
    const totalUsers = await prisma.user.count();

    // Build pagination object with page, limit, totalPages, hasNext, hasPrev
    const pagination ={
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1
    }
    // return users and pagination
    res.json({
        users,
        pagination
    });

}

// search
const search = async(req, res) =>{
    const searchQuery = req.query.q;

    // Validate search query
    if(!searchQuery || searchQuery.trim().length < 2){
        return res.status(StatusCodes.BAD_REQUEST).json({
            error:"Search query must be at least 2 characters long."
        })
    }

    // Get limit
    const limit = parseInt(req.query.limit) || 20;

    // Construct search pattern outside the query for proper parameterization
    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;

    // Use Raw SQL for complex text search with parameterized queries
    const searchResults = await prisma.$queryRaw`
        SELECT 
            t.id,
            t.title,
            t.is_completed as "isCompleted",
            t.priority,
            t.created_at as "createdAt",
            t.user_id as "userId",
            u.name as "userName",
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE t.title ILIKE ${searchPattern}
            OR u.name ILIKE ${searchPattern}
            ORDER BY
                CASE
                    WHEN t.title ILIKE ${exactMatch} THEN 1
                    WHEN t.title ILIKE ${startsWith} THEN 2
                    WHEN t.title ILIKE ${searchPattern} THEN 3
                    ELSE 4
                END,
                t.created_at DESC
            LIMIT ${parseInt(limit)}

        `;
//    Return result with query and count
     res.status(StatusCodes.OK).json({
        results: searchResults,
        query: searchQuery,
        count: searchResults.length
     })
}

module.exports = {
    analytics,
    users,
    search
}
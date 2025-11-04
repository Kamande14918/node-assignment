const errorHandlerMiddleware = (err, req, res, next) =>{
    console.error('Error occuered', err.message);

    if(err?.name === 'PrismaCLientInitializationError'){
        console.log("Couldn't connect to the database. Is it running?");
        return res.status(500).json({error: "Database connection failed",
            message: "Couldn't connect to the database. Is it running?"
        })
    }

    // Handle other prisma errors 
    if(err.code === 'P2002'){
        return res.status(400).json({
            error:"Duplicate entry"
        });
    }
    //Default error response
    res.status(500).json({
        error: "Internal server error"
    })

}


module.exports = errorHandlerMiddleware;
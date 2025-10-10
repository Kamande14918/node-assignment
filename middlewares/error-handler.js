const {statusCodes}= require('http-status-codes');
const errorMiddleware = (err, req, res, next) =>{
  console.log("Internal server error:",error.constructor.name,JSON.stringify(err,["name","message","stack"]));

  if(!res.headerSent){
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json(
      "An internal server error occurred!"
    )
  }
}

module.exports = errorMiddleware;
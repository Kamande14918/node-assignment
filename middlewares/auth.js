const authMiddleware = (req, res, next) => {
    const loggedOnUser = req.loggedOnUser;
    if(!loggedOnUser){
        return res.status(401).json({message:"Unauthorized access."});
    }
    next();
}
module.exports = authMiddleware;
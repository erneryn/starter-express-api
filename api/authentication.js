const jwt = require('jsonwebtoken')

module.exports = function(req,res,next){
    try {
        let token = req.headers['token']
        let user = jwt.verify(token,process.env.SECRET_KEY)
        req.user = user
        next()
    } catch (error) {
        res.status(400).json({
            error,
            message : 'Token Error'
        })
    }
}
const jwt = require('jsonwebtoken');
const User  = require('../schema/user.schema');

const authUserMiddleware = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }
    const jwttoken = token.replace("Bearer" , "").trim();
    console.log(jwttoken);
    
    try {
        
        const isVerifed = jwt.verify(jwttoken , process.env.SECRET_KEY);

        const userData = await User.findOne({email : isVerifed.email});
        req.user = userData;
        req.token = token;
        req.userID = isVerifed._id;

        console.log(userData);
        next()
        
    }
    catch(error) {
        res.status(500).send('Error logging in: ' + error.message);
    }
}

module.exports = authUserMiddleware
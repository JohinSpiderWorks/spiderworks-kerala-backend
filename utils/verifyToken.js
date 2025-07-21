require('dotenv').config();
const jwt=require('jsonwebtoken');
const verifyToken=(token)=>{
    const id=jwt.verify(token,process.env.JWT_SECRET_TOKEN)
    return id;
}

module.exports=verifyToken
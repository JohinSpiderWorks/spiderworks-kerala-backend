require('dotenv').config();
const jwt=require('jsonwebtoken');
 const generateToken=(id)=>{
    const token=jwt.sign(id,process.env.JWT_SECRET_TOKEN);
    return token;
}

module.exports=generateToken
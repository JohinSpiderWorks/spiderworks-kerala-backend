const bcrypt=require('bcrypt');
const hash=async(password)=>{
   const hashPassword= await bcrypt.hash(password,10);
   return hashPassword;

}

module.exports=hash
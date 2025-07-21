const path=require('path')

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|svg|ico/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
  
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }




  module.exports=checkFileType;
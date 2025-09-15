const express=require('express');
const { getAllJobs, getJobDetails, updateJob, deleteJob, createJob, appliedJobs, applyJob, removeAppliedJob } = require('../controller/api/career.controller');
const { userAuth } = require('../middleware/auth.middleware');
const router=express.Router();
const multer=require('multer');
const storage = multer.diskStorage({
    destination: "./uploads/resume", // Folder to store uploaded images
    filename: (req, file, cb) => {
      cb(
        null,
        file.originalname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  });
  const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      checkFileType(file, (error, isValid, jsonError) => {
        if (isValid) {
          cb(null, true);
        } else {
          cb(error);
        }
      });
    },
  });


router.get('/',getAllJobs);
router.get('/:id',getJobDetails);
router.use(userAuth);
router.post('/',createJob);
router.put('/:id',updateJob);
router.delete('/:id',deleteJob);
router.get('/applied',appliedJobs);
router.post('/applied',upload.single('resume'),applyJob);
router.delete('/applied/:id',removeAppliedJob)

module.exports=router;
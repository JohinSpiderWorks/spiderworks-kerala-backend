const express=require('express');
const { getAllServices, createService, getServiceDetail, updateService, deleteService } = require('../controller/api/service.controller');
const { userAuth } = require('../middleware/auth.middleware');

const router=express.Router();

router.get('/',getAllServices);
router.get('/:id',getServiceDetail);
router.use(userAuth);
router.post('/',createService);
router.put('/:id',updateService);
router.delete('/:id',deleteService);

module.exports=router;
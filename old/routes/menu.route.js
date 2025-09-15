
const express=require('express');
const { AllFooterDesktop,AllFooterMobile,AllMainDesktop,AllMainMobile } = require('../controller/api/menu.controller');
const { userAuth } = require('../middleware/auth.middleware');
const router=express.Router();

// router.use(userAuth);
router.get('/maindesktop',AllMainDesktop);
router.get('/footerdesktop',AllFooterDesktop);
router.get('/mainmobile',AllMainMobile);
router.get('/footermobile',AllFooterMobile);

module.exports=router;
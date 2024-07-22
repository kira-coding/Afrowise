const express = require('express');
const router= express.Router()

router.get('',(req,res)=>{
    res.render('public/index',{})
    return
})

module.exports=router
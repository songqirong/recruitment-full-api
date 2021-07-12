const AvatarModel = require('../model/avatarModel');
const express = require('express');
const router = express.Router();
// 获取所有可选择的默认头像
router.get('/getAllAvatar', function(req, res, next){
  AvatarModel.find({}).then(arr => {
    res.status(200).json({
      err_code: 0,
      data: arr
    })
  })
})
module.exports = router;
const { verify } = require('crypto');
const express = require('express');
const router = express.Router();
const JobModel = require('../model/jobModel');
const SeekerModel = require('../model/seekerModel');
const UserModel = require('../model/userModel');
const { verifyUser, findFun } = require('../utils/base');
const { token_aes_key } = require('../utils/keys');
router.get("/getList", async(req, res, next) => {
  const { page, limit } = req.query;
  const user = await verifyUser(req, res);
  const { user_type } = user;
  const model = user_type === 'BOSS' ? SeekerModel : JobModel;
  const arr = await findFun(model, {});
  // SeekerModel.find()
  model.find({}).sort({create_time : -1}).skip((page-1)*limit).limit(Number(limit)).then(arr1 => {
    if(arr.length > 0){
      res.json({
        err_code: 0,
        data: {
          list: arr1,
          total: arr.length
        }
      })
    }
  })
})
module.exports = router;
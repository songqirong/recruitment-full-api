var express = require('express');
var router = express.Router();
const UserModel = require('../model/userModel');
const JobModel = require('../model/jobModel');
const SeekerModel = require('../model/seekerModel');
const UserListModel = require('../model/userListModel');
const cookie = require('cookie');
const { md5_fun, aesEncrypt, findFun, verifyUser, addFun, updateFun, deleteFun, updateManyFun } = require('../utils/base');
const { phone_aes_key, token_aes_key } = require('../utils/keys');
const userListModel = require('../model/userListModel');
/* GET users listing. */

// 注册
router.post('/regist', function(req, res, next) {
  // res.send('respond with a resource');
  const { phone_number: phone, password: pass, user_type, password2 } = req.body;
  if(phone && pass && password2 && user_type){
    if(pass !== password2){
      res.json({
        err_code: 'PARAMS_ERROR',
        err_msg: '两次密码不一致'
      })
    } else {
      const phone_key = aesEncrypt(phone, phone_aes_key);
      const reg=/(\d{3})\d{4}(\d{4})/; //正则表达式
      const phone_number= phone.toString().replace(reg, "$1****$2")
      const password = md5_fun(pass);
      const user_avatar = '';
      const defaultNicknameList = ['广东彭于晏', '江西吴彦祖', '上海胡歌', '台湾蔡徐坤', '北京古天乐', '湖南杨幂', '浙江汪东城']
      UserModel.find({ phone_key }).then(async(arr) => {
        if(arr.length > 0){
          res.status(422).json({
            err_code: 'USER_HAS_EXIST',
            err_msg: '该手机号已经被注册～'
          })
        } else {
          const now = Date.now();
          const arr1 = await addFun(UserModel, {phone_number, password, user_type, user_avatar, create_time: now, user_name: phone_number, phone_key, nickname: defaultNicknameList[Math.ceil(Math.random() * 7) - 1]});
          if(arr1.length > 0){
            res.status(200).json({
              err_code: 0,
              msg: '注册成功'
            })
          }
        }
      })
    }
  } else {
    res.status(403).json({
      err_code: 'PARAMS_INVALID',
      err_msg: '缺少必填参数'
    })
  }
});

// 登录
router.post('/login', function(req, res, next){
  const { phone_number, password: pass } = req.body;
  const phone_key = aesEncrypt(phone_number, phone_aes_key);
  const password = md5_fun(pass);
  UserModel.find({phone_key, password}).then(arr => {
    if(arr.length > 0){
      // Set a new cookie with the name
      const token = aesEncrypt({ _id: arr[0]._id }, token_aes_key);
      res.setHeader('Set-Cookie', cookie.serialize('token', token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
        domain: 'persion.cn',
        sameSite: 'None',
        secure: true,
        path: '/'
      }));
      res.status(200).json({
        err_code: 0,
        msg: '登录成功',
        userInfo: arr[0]
      })
    } else {
      res.status(403).json({
        err_code: 'PARAMS_ERROR',
        err_msg: '手机号或密码输入错误'
      })
    }
  })
})

// 退出登录
router.post('/logout', function(req, res, next){
  res.setHeader('Set-Cookie', cookie.serialize('token', undefined, {
    maxAge: -1,
    domain: 'persion.cn',
    path: '/'
  }));
  res.status(200).json({
    err_code: 0,
    msg: '退出登录成功',
  })
})

// 获取用户信息
router.get('/getUserInfo', async(req, res, next) => {
  const user = await verifyUser(req, res);
  res.status(200).json({
    err_code: 0,
    userInfo: user
  })
})

/* 完善用户信息 
  { 
    user_type: 'SEEKERS' | 'BOSS',
    user_avatar: string,
    company_name: string,
    recruitment_salary: number,
    recruitment_job: string,
    recruitment_request: string,
    personal_introduction: string,
    apply_job: string,
  } 
*/
router.post('/detailInfo', async(req, res, next) => {
  const { user_avatar, company_name, recruitment_salary, recruitment_job, recruitment_request, apply_job, personal_introduction } = req.body;
  const user = await verifyUser(req, res); // 校验token并查询当前登录人信息
  const { user_type, _id, nickname } = user;
  if(user_type === 'BOSS' && !(user_avatar && company_name && recruitment_job && recruitment_request && recruitment_salary)){
    res.status(403).json({
      err_code: 'PARAMS_ERROR',
      err_msg: '传入参数错误'
    })
  } else if(user_type === 'SEEKER' && !(user_avatar && apply_job && personal_introduction)){
    res.status(403).json({
      err_code: 'PARAMS_ERROR',
      err_msg: '传入参数错误'
    })
  } else {
    const create_time = Date.now();
    // 更新头像
    const resObj1 = await updateFun(UserModel, { _id }, { user_avatar });
    const rule = { user_id: _id };
    const [model, data] = user_type === 'BOSS' ? 
    [ JobModel, { recruitment_salary, recruitment_job, recruitment_request, create_time, company_name, avatar_url: user_avatar, ...rule, nickname }] 
    : 
    [ SeekerModel, { apply_job, personal_introduction, create_time, avatar_url: user_avatar, ...rule, nickname } ];
    // 查询数据库中有没有该数据
    const arr1 = await findFun(model, rule);
    if(arr1.length > 0){
      res.status(409).json({
        err_code: 'CONFLICT_BEHAVIOR',
        err_msg: '您已补充过详细信息'
      })
    } else {
      const arr = await addFun(model, data);
      if(resObj1.ok > 0 && arr.length > 0){
        res.status(200).json({
          err_code: 0,
          msg: "完善信息成功"
        })
        // 完善信息后推送新注册用户
        process.io.emit('completeInfo', { err_code: 0, type: 'completeInfo', user_type });
      } else {
        res.status(500).json({
          err_code: "UNKNOW_ERROR",
          msg: '未知错误'
        })
      }
    }
  }
})

// 获取用户详细信息（补充信息）
router.get('/detailInfo', async(req, res) => {
  const user = await verifyUser(req, res);
  const { _id, user_type } = user;
  const isBoss = user_type === 'BOSS';
  const fn = isBoss ? 
  JobModel 
  : 
  SeekerModel;
  fn.find({user_id: _id}).sort({ create_time: -1 }).then(arr1 => {
    res.status(200).json({
      err_code: 0,
      data: arr1
    })
  })
});

// 更新用户详细信息
router.patch(`/detailInfo/:id`, async (req, res) => {
  const { id } = req.params;
  const obj = req.body;
  const { user_type } = await verifyUser(req, res);
  const model = user_type === 'BOSS'? JobModel : SeekerModel;
  // 先查找
  const res1 = await updateFun(model, { _id: id }, obj);
  if(res1.ok > 0){
    res.status(200).json({
      err_code: 0,
      msg: '更新信息成功'
    })
  }
})

// 删除用户详细信息
router.delete('/detailInfo/:id', async (req, res) => {
  const { id } = req.params;
  const { user_type } = await verifyUser(req, res);
  const model = user_type === 'BOSS'? JobModel : SeekerModel;
  const res1 = await deleteFun(model, { _id: id });
  res.status(200).json({
    err_code: 0,
    msg: '删除信息成功'
  })
})

// 用户主页新增详细信息
router.post('/insertDetailInfo', async(req, res, next) => {
  const { company_name = '', recruitment_salary = 0, recruitment_job = '', recruitment_request = '', apply_job = '', personal_introduction = '' } = req.body;
  const user = await verifyUser(req, res); // 校验token并查询当前登录人信息
  const { user_type, _id, nickname, user_avatar } = user;
  const avatar_url = user_avatar ? user_avatar : 'https://static.persion.cn/images/others/dog.webp';
  // 没有完善过信息
  if(!user_avatar){
    // 更新头像
    await updateFun(UserModel, { _id }, { user_avatar: avatar_url });
  }
  const create_time = Date.now();
  const rule = { user_id: _id };
  const [model, data] = user_type === 'BOSS' ? 
  [ JobModel, { recruitment_salary, recruitment_job, recruitment_request, create_time, company_name, avatar_url, ...rule, nickname }] 
  : 
  [ SeekerModel, { apply_job, personal_introduction, create_time, avatar_url, ...rule, nickname } ];
  // 查询数据库中有没有该数据
  const arr = await addFun(model, data);
    if(arr.length > 0){
      res.status(200).json({
        err_code: 0,
        msg: "完善信息成功",
        data: arr[0]
      })
    } else {
      res.status(500).json({
        err_code: "UNKNOW_ERROR",
        msg: '未知错误'
      })
    }
})

// 更新头像
router.patch('/updateAvatar', async(req, res, next) => {
  const { user_avatar } = req.body;
  const user = await verifyUser(req, res); // 校验token并查询当前登录人信息
  const { user_type, _id, nickname } = user;
  // 更新user表
  const res1 = await updateFun(UserModel, { _id }, { user_avatar });

  // 更新岗位表
  const isBoss = user_type === 'BOSS';
  const model = isBoss ? JobModel : SeekerModel;
  const rule = {user_id: _id};
  // 先查询
  const arr1 = await findFun(model, rule);
  if(arr1.length > 0){
    // 后更新
    const res2 = await updateManyFun(model, rule, { avatar_url: user_avatar });
  }
  
  // 更新聊天用户列表
  const res3 = await updateManyFun(userListModel, rule, { user_avatar });
  if(res1.ok > 0 && res3.ok > 0){
    res.status(200).json({
      err_code: 0,
      msg: '更新头像成功'
    })
  }
})


module.exports = router;

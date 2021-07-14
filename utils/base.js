const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cookie  = require('cookie');
const { iv, token_aes_key } = require('./keys');
const UserModel = require('../model/userModel');

// 生成token
// function fetchjwt(data){
//   return jwt.sign({
//     exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
//     data
//   }, token_key);
// }

// // 解析token
// function verifyToken(req, res) {
//   const data = req.headers.cookie;
//   console.log(data, 'data')
//   const { token } = cookie.parse(data);
//     if (!token) {
//       return res.status(401).json({err_code: 'TOKEN_HAS_OVERDUE', err_msg:'token invalid'})
//     }
//     return new Promise(function(resolve, reject) {
//       try {
//         let decoded = jwt.verify(token, token_key)
//         resolve(decoded.data)
//       } catch(err) {
//         res.status(401).json({err_code: 'TOKEN_HAS_OVERDUE', err_msg:'token invalid'})
//       }
//     })
// }

// 加密密码
function md5_fun(password){
  return crypto.createHash('md5').update(password).digest('hex')
}

// aes算法（对称加密算法）加密 当前用来加密手机号, token,
function aesEncrypt(data, key) {
  data = JSON.stringify(data);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  var crypted = cipher.update(data, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

// aes算法解密 当前用来解密手机号, token
function aesDecrypt(encrypted, key) {
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  var decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// token过期
function verifyToken(req, res){
  const { cookie: cookies = '' } = req.headers;
  const { token } = cookie.parse(cookies);
  if(!token){
    res.status(401).json({
      err_code: 'TOKEN_INVALID',
      err_msg: '登录信息已过期'
    })
  } else {
    return aesDecrypt(token, token_aes_key); // token = { _id }
  }
}

// 校验token并查找当前登录信息
const verifyUser = async(req, res) => {
  const user = verifyToken(req, res); //解析token
  const arr = await findFun(UserModel, user);
  if(arr.length > 0){
    return arr[0]
  } else {
    res.status(422).json({
      err_code: 'USER_NOT_EXIST',
      err_msg: '此用户不存在'
    })
  }
}

// 查找
function findFun(model, rule){
  return new Promise((resolve, reject) => {
    model.find(rule).then(arr => {
      resolve(arr)
    })
  })
}

// 新增
function addFun(model, obj){
  return new Promise((resolve, reject) => {
    model.insertMany([ obj ]).then((arr) => {
      resolve(arr)
    })
  })
}

// 更新
function updateFun(model, rule, obj){
  return new Promise((resolve, reject) => {
    model.updateOne(rule, { $set: obj }).then((arr) => {
      resolve(arr)
    })
  })
}

// 更新多条数据
function updateManyFun(model, rule, obj){
  return new Promise((resolve, reject) => {
    model.updateMany(rule, { $set: obj }).then((arr) => {
      resolve(arr)
    })
  })
}

// 删除
function deleteFun(model, rule){
  return new Promise((resolve, reject) => {
    model.deleteOne(rule).then((arr) => {
      resolve(arr)
    })
  })
}



module.exports = {
  md5_fun,
  aesEncrypt,
  aesDecrypt,
  verifyToken,
  verifyUser,
  findFun,
  addFun,
  updateFun,
  updateManyFun,
  deleteFun,
}
var express = require('express');
var router = express.Router();
const { findFun, addFun, updateFun, verifyUser, updateManyFun } = require('../utils/base');
const MessageModel = require('../model/messageModel');
const UserListModel = require('../model/userListModel');
const messageModel = require('../model/messageModel');

const socketFun = function socket(server){
  // 这是websocket服务的创建
  var io = require('socket.io')(server, {
    // path: '/test',
    cors: true,
    serveClient: false,
    // below are engine.IO options
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
  });
  process.io= io;
  io.on('connection', function(socket) {
    
    // 监听客户端发来的消息
    socket.on('server', async(data) =>{
      const { from_user_id, to_user_id, from_user_avatar, to_user_avatar, content, from_user_nickname, to_user_nickname } = data;
      const now = Date.now();
      // 发消息
      const updateObj = { last_content: content, update_time: now };
      // 查询发送消息人列表并更新
      const arr1 = await findFun(UserListModel, {user_id: to_user_id, belong_user_id: from_user_id});
      let data1, data2, data3, insert1, insert2;
      if(arr1.length > 0){
        const obj1 = await updateFun(UserListModel, {user_id: to_user_id, belong_user_id: from_user_id}, updateObj)
        if(obj1.ok > 0){
          data1 = { ...arr1[0]._doc, ...updateObj };
          insert1 = false;
        }
      } else {
        // 新增聊天列表
        const arr2 = await addFun(UserListModel, {user_id: to_user_id, belong_user_id: from_user_id, user_avatar: to_user_avatar, ...updateObj, nickname: to_user_nickname})
        data1 = arr2[0];
        insert1 = true;
      }
      // 查询消息接收人的列表并更新
      const arr3 = await findFun(UserListModel, {user_id: from_user_id, belong_user_id: to_user_id});
      if(arr3.length > 0){
        const obj2 = await updateFun(UserListModel, {user_id: from_user_id, belong_user_id: to_user_id}, updateObj);
        if(obj2.ok > 0){
          data3 = { ...arr3[0]._doc, ...updateObj};
          insert2 = false;
        }
      } else {
        const arr4 = await addFun(UserListModel, {user_id: from_user_id, belong_user_id: to_user_id, ...updateObj, user_avatar: from_user_avatar, nickname: from_user_nickname});
        data3 = arr4[0];
        insert2 = true;
      }

      // 新增消息列表
      data2 = { content, to_user_id, from_user_id, create_time: now, read: false, chat_id: `${from_user_id}_${to_user_id}` };
      const arr5 = await addFun(messageModel, data2);
      if( arr5.length > 0 ){
        socket.emit(from_user_id, { err_code: 0, user_obj: data1, message_obj: arr5[0], insert: insert1, isMe: true, type: 'sendMsg' });
        socket.emit(to_user_id, { err_code: 0, user_obj: data3, message_obj: arr5[0], insert: insert2, isMe: false, type: 'sendMsg' });
      }
    })
  })
}

// 获取消息用户列表
router.get('/getUserList', async(req, res, next) => {
  const user = await verifyUser(req, res);
  const { _id } = user;
  UserListModel.find({belong_user_id: _id}).sort({update_time: -1}).then(arr => {
    res.status(200).json({
      err_code: 0,
      data: arr,
    })
  })
})

// 获取当前聊天信息列表
router.get('/getMessageList', async(req, res, next) => {
  const { limit, page, user_id } = req.query;
  const user = await verifyUser(req, res);
  const { _id } = user;
  MessageModel.find({ $or: [ { chat_id: `${_id}_${user_id}` }, { chat_id: `${user_id}_${_id}` } ] }).sort({ create_time: -1 }).skip((page-1)*limit).limit(Number(limit)).then(arr => {
    res.status(200).json({
      err_code: 0,
      data: arr,
    })
  })
})

// 更新已读
router.put('/updateMessageList', async(req, res, next) => {
  const { chat_id } = req.query;
  const user = await verifyUser(req, res);
  const { _id } = user;
  const res1 = await updateManyFun(MessageModel, { to_user_id: _id, from_user_id: chat_id }, { read: true })
  console.log(res1, 'res');
  res.status(200).json({
    err_code: 0,
    msg: '更新成功'
  })
})


module.exports = {
  socketFun,
  socketRouter: router,
}

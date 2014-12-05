var express = require('express');
var router = express.Router();
var db = require('../models');
var bcrypt = require('bcrypt');
var async = require('async');


router.get('/', function(req, res) {
  var json = {
    result: 1,
    message: "here is root of auth.js"
  };
  res.send(json);
});

router.post('/regist', function(req, res) {
  if( !req.body.gcm_reg_id ) {
    res.send({
      result: RESULT_CODE_NEED_GCM_REG_ID,
      message: 'must need gcm registration id'
    });
    return;
  }

  if( !req.body.phone_number ) {
    res.send({
      result: RESULT_CODE_NEED_PHONE_NUMBER,
      message: 'must need gcm registration id'
    });
    return;
  }

  db.User
    .find({
      where: {
        userID: req.body.userid
      }
    })
    .success(function (user) {
      if( user ) {
        res.send({
          result: RESULT_CODE_ALREADY_EXIST_USERID,
          message: 'already exist user id'
        });
        return;
      }

      bcrypt.hash(req.body.password, 
        8, 
        function(err, hash) {
          if( err ) {
            res.send({
              result: RESULT_CODE_FAIL,
              message: 'unknown error'
            })
            return;
          }

          var token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
          var data = { 
            nickname: req.body.nickname,
            userID: req.body.userid,
            password: hash,
            phoneNumber: req.body.phone_number,
            gcmRegistrationID: req.body.gcm_reg_id,
            accessToken: token
          };

          db.User
            .create(data)
            .success(function(user){
              res.send({
                result: RESULT_CODE_SUCCESS,
                message: 'welcome!',
                accessToken: user.accessToken
              })
            })
            .error(function(err){
              res.send({
                result: RESULT_CODE_FAIL,
                message: 'fail to instantiate user'
              })
            });
        });
    });
});

router.get('/regist/validate/id', function(req, res) {
  db.User
    .find({
      where: {
        'userid': req.param('userid')
      }
    })
    .success(function (user) {
      if( user ) {
        res.send({
          result: RESULT_CODE_ALREADY_EXIST_USERID,
          message: 'already exist user id'
        });
        return;
      }

      res.send({
        result: RESULT_CODE_SUCCESS,
        message: 'you can use that id!'
      });
    });
});

router.get('/signin', function(req, res) {
  var callbackSuccess = function(accessToken) {
    res.send({
      result: RESULT_CODE_SUCCESS,
      message: 'successfully sign in!',
      accessToken: accessToken
    });
  }
  var callbackFail = function() {
    res.send({
      result: RESULT_CODE_AUTH_FAIL,
      message: ERROR_MESSAGE_FAIL_TO_SIGNIN
    });
  }

  async.waterfall([
    function(callback) {
      db.User
      .find({
        where: {
          userID: req.param('userid')
        }
      })
      .success(function (user) {
        if( ! user ) {
          callbackFail();
          return;
        }

        callback(null, user);
      })
    }
    ], function(err, user) {
      if( err ) {
        callbackFail();
        return;
      }

      bcrypt.compare(req.param('password'), user.password, function(err, res) {
        if( err || ! res ) {
          callbackFail();
          return;
        }

        var token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
        user.accessToken = token;
        user.gcmRegistrationID = req.param('gcm_reg_id');
        user.save().success(function() {
          callbackSuccess(token);
        });
      });
    });
});


module.exports = router;

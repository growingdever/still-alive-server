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

router.get('/regist', function(req, res) {
  async.waterfall([
    function(callback) {
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

        callback(null);
      })
    }
    ], function(err) {
      if( err ) {
        res.send({
          result: RESULT_CODE_FAIL,
          message: 'unknown error'
        })
        return;
      }

      bcrypt.hash(req.param('password'), 
        8, 
        function(err, hash) {
          var data = { 
            'userID': req.param('userid'),
            'password': hash
          };

          db.User
            .create(data)
            .complete(function(err, user){
              if( err ) {
                res.send({
                  result: RESULT_CODE_ERROR,
                  message: 'error occured...'
                });
              } else {
                res.send({
                  result: RESULT_CODE_SUCCESS,
                  message: 'welcome!'
                })
              }
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
  var callbackSuccess = function() {
    res.send({
      result: RESULT_CODE_SUCCESS,
      message: 'successfully sign in!'
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
          'userid': req.param('userid')
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

        callbackSuccess();
      });
    });
});


module.exports = router;

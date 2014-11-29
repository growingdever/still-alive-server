var express = require('express');
var router = express.Router();
var db = require('../models');
var sequelize = require('sequelize');
var async = require('async');
var validator = require('validator');


function accessTokenCheck(req, res, next) {
  if( ! req.param('access_token') ) {
    res.send({
      result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
      message: 'give me a valid access token!'
    });
    return;
  }

  next();
}

/* GET users listing. */
router.get('/', function(req, res) {
  var json = {
    result: 0,
    message: "success!"
  };
  res.send(json);
});

// just for testing
router.get('/delete', function(req, res) {
  db.User
    .find({ 
      where: {
      userID: req.param('userid')
      }
    })
    .success(function(user) {
      user.destroy().success(function() {
        res.send({ result: 1 });
      });
    });
});

router.get('/search', function(req, res) {
  var subs = validator.escape(req.param('keyword'));

  query = "userID LIKE \'" + subs + '%\''; // userID LIKE 'foo%'
  db.User
    .findAll({
      where: [ query ]
    })
    .success(function(users) {
      var arr = [];
      for (var i = users.length - 1; i >= 0; i--) {
        var json = {};
        json.id = users[i].id;
        json.userID = users[i].userID;
        json.nickname = users[i].nickname;
        arr.push( json );
      };

      res.send({
        result: RESULT_CODE_SUCCESS,
        data: arr
      });
    });
});

router.get('/ask', accessTokenCheck, function(req, res) {
  var dest_id = req.param('target_userid');

  db.User
    .findAll({
      where: sequelize.or(
          { accessToken: req.param('access_token') },
          { userID: dest_id }
        )
    })
    .success( function(users) {
      if( users.length < 2 ) {
        res.send({
          result: RESULT_CODE_NOT_FOUND_USERID,
          message: 'cannot found user...'
        });
        return;
      }

      var src = -1, dest = -1;
      if( users[0].accessToken == req.param('access_token') ) {
        src = 0;
        dest = 1;
      }
      else if( users[1].accessToken == req.param('access_token') ) {
        src = 1;
        dest = 0;
      }

      if( src == -1 ) {
        res.send({
          result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
          message: 'give me a valid access token!'
        });
        return;
      }

      var data = {
        userID : users[src].userID,
        targetUserID : users[dest].userID
      };

      db.Request
        .findOrCreate({ 
          userID: data.userID, 
          targetUserID: data.targetUserID,
        })
        .success(function(request, created){
          if( created ) {
            res.send({
              result: RESULT_CODE_SUCCESS,
              message: 'send request successfully!',
              request_id: request.id
            });
          }
          else {
            if( request.enabled == 0 ) {
              request.enabled = 1;
              request.save().success(function(){
                res.send({
                  result: RESULT_CODE_SUCCESS,
                  message: 'send request successfully!',
                  request_id: request.id
                });
              });
            }
            else {
              res.send({
                result: RESULT_CODE_ALREADY_EXIST_REQUEST,
                message: 'you already request to him or her...',
                request_id: request.id
              });
            }
          }
        });
    });
});

router.get('/received_requests', accessTokenCheck, function(req, res) {
  async.waterfall([
    function(callback) {
      db.User
        .find({ 
          where: { 
            accessToken: req.param('access_token') 
          }
        })
        .success(function(user){
          callback(null, user);
        });
    },
    function(user, callback) {
      if( user == null ) {
        res.send({
          result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
          message: 'give me a valid access token!'
        });
        return;
      }

      db.Request
        .findAll({
          where: sequelize.and(
            { targetUserID: user.userID },
            { enabled: true }
          ),
          attributes: ['id', 'userID', 'targetUserID']
        })
        .success(function(requests){
          callback( null, requests );
        });
    }
    ], function(err, requests) {
      if( err ) {
        res.send({
          result: RESULT_CODE_FAIL,
          message: 'unknown error'
        });
        return;
      }

      res.send({
        result: RESULT_CODE_SUCCESS,
        data: requests
      });
    });
});

router.get('/accept', accessTokenCheck, function(req, res) {
  var req_id = req.param('req_id');
  var accessToken = req.param('access_token');

  db.Request
    .find({
      where: { id : req_id }
    })
    .success(function(request) {
      var src_id = request.userID;
      var dest_id = request.targetUserID;

      db.User
        .find({
          where: { 
            userID: dest_id, 
            accessToken: accessToken 
          }
        })
        .success(function(user) {
          if( ! user ) {
            res.send({
              result: RESULT_CODE_NOT_VALID_ACCESS_TOKEN,
              message: 'not valid access token'
            });
            return;
          }

          request.enabled = false;
          request.save().success(function(){
            async.waterfall([
              function(callback) {
                db.Relationship
                  .create({
                    userID: src_id,
                    targetUserID: dest_id
                  })
                  .complete(function (err, relationship){
                    if (err) {
                      res.send({
                        result: RESULT_CODE_DB_ERROR,
                        message: 'error occured...'
                      });
                      return;
                    }

                    callback();
                  });
              },
              function(callback) {
                db.Relationship
                  .create({
                    userID: dest_id,
                    targetUserID: src_id
                  })
                  .complete(function (err, relationship){
                    if (err) {
                      res.send({
                        result: RESULT_CODE_DB_ERROR,
                        message: 'error occured...'
                      });
                      return;
                    }

                    callback(null);
                  });
              }
              ], function(err) {
                if( err ) {
                  res.send({
                    result: RESULT_CODE_FAIL,
                    message: 'unknown error'
                  });
                  return;
                }

                res.send({
                  result: RESULT_CODE_SUCCESS,
                  message: 'success!'
                });
              });
          });
      });
    });
});



module.exports = router;
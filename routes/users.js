var express = require('express');
var router = express.Router();
var db = require('../models');
var sequelize = require('sequelize');
var async = require('async');


/* GET users listing. */
router.get('/', function(req, res) {
  var json = {
    result: 0,
    message: "success!"
  };
  res.send(json);
});

router.get('/search', function(req, res) {
  var subs = req.param('keyword');
  query = "userID LIKE " + '\'' + subs + '%\''; // userID LIKE 'foo%'
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

router.get('/ask', function(req, res) {
  var src_id = req.param('source_user_id');
  var dest_id = req.param('dest_user_id');

  db.User
    .findAll({
      where: sequelize.or(
          { userID: src_id },
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

      var data = {
        userID : src_id,
        targetUserID : dest_id
      };

      db.Request
        .create(data)
        .complete(function(err, req){
          if( err ) {
            res.send({
              result: RESULT_CODE_FAIL,
              message: 'error occured...'
            });
          } else {
            res.send({
              result: RESULT_CODE_SUCCESS,
              message: 'send request successfully!',
              request_id: req.id
            });
          }
        });
    });
});

router.get('/accept', function(req, res) {
  var req_id = req.param('req_id');

  db.Request
    .find({
      where: { id : req_id }
    })
    .success(function(request) {
      var src_id = request.userID;
      var dest_id = request.targetUserID;

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
              })
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



module.exports = router;
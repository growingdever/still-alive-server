var express = require('express');
var router = express.Router();
var db = require('../models');


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/:userid/list', function(req, res) {
  db.Relationship
    .findAll({
      where: { userID: req.param('userid') }
    })
    .success( function(users) {
      if ( ! users ) {
        res.send({
          success: RESULT_CODE_FAIL,
          message: 'failed to load data from db'
        });
        return;
      }

      var targets = [];
      for (var i = users.length - 1; i >= 0; i--) {
        targets.push( users[i].targetUserID );
      };

      db.User
        .findAll({ 
          where: { userID: targets },
          attributes: [ 'id', 'userID', 'updatedAt' ]
        })
        .success(function(users) {
          res.send({
            result: RESULT_CODE_SUCCESS,
            data: users
          });
        });      
    });
});

router.get('/:userid/update', function(req, res) {
  db.User
    .find({ where: { userID: req.param('userid') } })
    .success(function(user) {
      if( ! user ) {
        res.send({
          result: RESULT_CODE_NOT_FOUND_USERID,
          message: 'cannot found user...'
        });
        return;
      }

      var date = new Date();
      user.updatedAt = date;
      user.save().success(function() {
        res.send({
          result: RESULT_CODE_SUCCESS,
          message: 'ok. you are still alive!'
        });
      });
    });
});

module.exports = router;

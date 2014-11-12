var express = require('express');
var router = express.Router();
var db = require('../models');

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



module.exports = router;
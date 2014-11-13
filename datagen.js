var http = require('http');
var request = require('request');

function CreateUser(userid) {
  var url = "http://ssh.ssucre.me:7778/auth/regist?userid=" + userid + "&" + "password=helloworld";
  http.get(url, function(response) {}).end();
}

module.exports.GenerateUser = function() {
  CreateUser('loki10');
  CreateUser('loki11');
  CreateUser('loki12');
  CreateUser('loki13');
  CreateUser('loki14');
}
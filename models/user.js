module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    userID: DataTypes.STRING,
    password: DataTypes.STRING,
    nickname: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    lastUpdateAt: DataTypes.DATE,
  }, {
    classMethods: {
      associate: function(models) {
        
      }
    }
  })

  return User
}
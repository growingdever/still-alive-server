module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    userID: DataTypes.STRING,
    password: DataTypes.STRING,
    nickname: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    gcmRegistrationID: DataTypes.STRING,
    accessToken: DataTypes.STRING,
    stateMessage: { 
      type: DataTypes.STRING, 
      defaultValue: 'Write in C....' 
    }
  }, {
    classMethods: {
      associate: function(models) {
        
      }
    }
  })

  return User
}
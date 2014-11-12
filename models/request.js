module.exports = function(sequelize, DataTypes) {
  var Request = sequelize.define('Request', {
    userID: DataTypes.STRING,
    targetUserID: DataTypes.STRING,
  }, {
    classMethods: {
      associate: function(models) {
        
      }
    }
  })

  return Request
}
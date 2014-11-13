module.exports = function(sequelize, DataTypes) {
  var Request = sequelize.define('Request', {
    userID: DataTypes.STRING,
    targetUserID: DataTypes.STRING,
    enabled: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    classMethods: {
      associate: function(models) {
        
      }
    }
  })

  return Request
}
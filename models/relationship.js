module.exports = function(sequelize, DataTypes) {
  var Relationship = sequelize.define('Relationship', {
    userID: DataTypes.STRING,
    targetUserID: DataTypes.STRING,
  }, {
    classMethods: {
      associate: function(models) {
        
      }
    }
  });

  return Relationship;
}
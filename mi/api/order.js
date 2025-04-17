module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      shipping_info: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      cart_items: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
      },
    });
  
    Order.associate = function (models) {
      // associations can be defined here
    };
  
    return Order;
  };
  
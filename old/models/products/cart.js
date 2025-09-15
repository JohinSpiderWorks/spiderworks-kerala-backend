const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");
const userModel = require("../user.model");
const AttributeValueProduct = require("./product_variants.model");

const Cart = sequelize.define(
  "carts",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    product_variant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'product_variants',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    timestamps: false,
    underscored: true,
    hooks: {
      beforeSave: (cart) => {
        cart.total_price = cart.quantity * cart.price;
        cart.updated_at = new Date();
      }
    }
  }
);


Cart.belongsTo(userModel, {
    foreignKey: 'user_id',
    as: 'user'
  });

  Cart.belongsTo(AttributeValueProduct, {
    foreignKey: 'product_variant_id',
    as: 'product_cart_variant'
  });

  



module.exports = Cart;

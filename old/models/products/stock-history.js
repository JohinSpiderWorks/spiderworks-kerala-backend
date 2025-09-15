const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const StockHistory = sequelize.define(
    "stock_history",
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'products',
                key: 'id'
            }
        },
        variant_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'product_variants',
                key: 'id',
            },
        },
        stocks_added: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        stock_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
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
        freezeTableName: true,
        underscored: true,
        paranoid: false,

    }
);


module.exports = StockHistory;

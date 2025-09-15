require("dotenv").config();
const { Sequelize } = require("sequelize");

// Debug environment variables
// console.log("Environment variables in sequelize.config.js:", {
//   DB_PASSWORD: process.env.DB_PASSWORD,
//   DB_PASSWORD_TYPE: typeof process.env.DB_PASSWORD,
//   DB_USER: process.env.DB_USER,
//   DB_NAME: process.env.DATABASE,
//   DB_HOST: process.env.HOST,
//   DB_PORT: process.env.DBPORT,
// });

const sequelize = new Sequelize({
  port: process.env.DBPORT || 5432,
  host: process.env.HOST || "localhost",
  username: process.env.DB_USER || "postgres",
  password: String(process.env.DB_PASSWORD || ""),
  database: process.env.DATABASE || "ark2",
  dialect: "postgres",
  retry: {
    max: 3,
    timeout: 30000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test connection on startup
sequelize
  .authenticate()
  .then(() => console.log("Database connection established"))
  .catch((err) => console.error("Database connection error:", err));

module.exports = sequelize;

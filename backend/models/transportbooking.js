'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransportBooking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  TransportBooking.init({
    booking_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    transport_id: DataTypes.INTEGER,
    booking_date: DataTypes.DATE,
    start_time: DataTypes.STRING,
    end_time: DataTypes.STRING,
    pic: DataTypes.STRING,
    section: DataTypes.STRING,
    status: DataTypes.STRING,
    notes: DataTypes.TEXT,
    destination: DataTypes.STRING,
    approver_id: DataTypes.INTEGER,
    approved_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'TransportBooking',
  });
  return TransportBooking;
};
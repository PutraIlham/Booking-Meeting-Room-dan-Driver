'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomBooking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RoomBooking.init({
    booking_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    room_id: DataTypes.INTEGER,
    booking_date: DataTypes.DATE,
    start_time: DataTypes.STRING,
    end_time: DataTypes.STRING,
    pic: DataTypes.STRING,
    section: DataTypes.STRING,
    status: DataTypes.STRING,
    notes: DataTypes.TEXT,
    approver_id: DataTypes.INTEGER,
    approved_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'RoomBooking',
  });
  return RoomBooking;
};
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Trip"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  category: {
    type: String,
    enum: ["Food", "Hotel", "Transport", "Shopping", "Entertainment", "Other"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Card", "UPI"],
    required: true,
  },
  description: {
    type: String,
  }
}, { timestamps: true });

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;

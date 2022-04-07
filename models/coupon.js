const { mongoose } = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true },
  type: { type: String, enum: ["Flat", "Percentage"], required: true },
  createdAt: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  minimum: { type: Number, required: true },
  flatAmount: { type: Number, required: isFlatCoupon },
  percentage: { type: Number, required: !isFlatCoupon },
  percentMaxLimit: { type: Number, required: !isFlatCoupon },
});

function isFlatCoupon() {
  return this.type === "Flat";
}

module.exports = mongoose.model("Coupons", couponSchema);

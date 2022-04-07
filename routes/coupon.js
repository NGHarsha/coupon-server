var express = require("express");
var router = express.Router();

const { check, validationResult } = require("express-validator");

const Coupon = require("../models/coupon");
const HttpError = require("../utils/http-error");

const isValidISO = (dateString) => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(dateString))
    return false;
  var d = new Date(dateString);
  return d.toISOString() === dateString;
};

router.get("/list", async (req, res, next) => {
  let coupons = [];
  try {
    coupons = await Coupon.find({}).sort({ createdAt: -1 });
  } catch (err) {
    return next(new HttpError("Something went wrong"));
  }

  return res.status(200).send({ data: coupons });
});

router.post(
  "/create",
  [
    check("code").trim().not().isEmpty(),
    check("type").isIn(["Flat", "Percentage"]),
    check("minimum").isFloat({ min: 1 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new HttpError("Invalid inputs passed, please check your data.", 422)
      );
    }
    const { code, type, start, end, minimum } = req.body;

    if (!isValidISO(start) || !isValidISO(end)) {
      return next(new HttpError("Invalid inputs."));
    }

    if (
      type === "Percentage" &&
      (req.body.percentage < 0 || req.body.percentage > 100)
    ) {
      return next(new HttpError("Invalid percentage range"));
    }

    try {
      const existingCoupon = await Coupon.findOne({ code: code.toLowerCase() });
      if (existingCoupon) {
        return next(new HttpError("Coupon with same code already exists", 422));
      }
    } catch (err) {
      console.log(err);
      return next(new HttpError("Something went wrong", 422));
    }

    const newCoupon = new Coupon({
      code: code.toLowerCase(),
      type,
      createdAt: new Date().toISOString(),
      start,
      end,
      minimum,
      ...(type === "Flat" && { flatAmount: req.body.flatAmount }),
      ...(type === "Percentage" && {
        percentage: req.body.percentage,
        percentMaxLimit: req.body.percentMaxLimit,
      }),
    });

    try {
      console.log("Saving coupon");
      await newCoupon.save();
    } catch (err) {
      console.log(err);
      return next(new HttpError("Something went wrong"));
    }

    res.status(201).send("Coupon created successfully");
  }
);

router.post(
  "/validate",
  [
    check("code").trim().not().isEmpty(),
    check("cartValue").isFloat({ min: 1 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new HttpError("Invalid inputs passed, please check your data.", 422)
      );
    }

    const { code, cartValue } = req.body;
    let existingCoupon;
    try {
      existingCoupon = await Coupon.findOne({ code: code.toLowerCase() });
    } catch (err) {
      console.log(err);
      return next(new HttpError("Something went wrong", 422));
    }
    if (!existingCoupon) {
      return next(new HttpError("No coupon found with the code", 400));
    }

    if (existingCoupon.end < new Date().toISOString()) {
      return next(new HttpError("Coupon has expired"), 400);
    }

    if (cartValue < existingCoupon.minimum) {
      return next(
        new HttpError(
          "Cart Value is less than the minimum value required for applying this coupon"
        ),
        400
      );
    }

    let discount;
    if (existingCoupon.type === "Flat") {
      discount = existingCoupon.flatAmount;
    } else {
      let temp = cartValue * (existingCoupon.percentage / 100);
      discount =
        temp < existingCoupon.percentMaxLimit
          ? temp
          : existingCoupon.percentMaxLimit;
    }

    return res.status(200).json({
      discount,
      priceAfterDiscount: cartValue - discount,
    });
  }
);

module.exports = router;

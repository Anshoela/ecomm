const express = require('express');
const router = express.Router();
const couponController = require('couponController');

router.get('/coupon/:code', couponController.getCouponByCode);

router.post('/coupon', couponController.getCouponByCode);

module.exports = router;
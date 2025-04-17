// Endpoint to validate a coupon code
const coupons = [
    {code: 'DISCOUNT10', discount: 10},
    {code: 'DISCOUNT20', discount: 20},
];

exports.getCouponByCode = (req, res) => {
    const { code } = req.params;
    const coupon = coupons.find((coupon) => coupon.code === code);

    if(!coupon) {
        return res.status(404).json({message: 'Coupon not found' });
    }
    res.json(coupon);
};

exports.createCoupon = (req, res) => {
    const { code, discount } = req.body;
    if (!code || !discount) {
        return res.status(400).json({message: 'Code and discount are required'});
    }

    const newCoupon = { code, discount };
    coupons.push(newCoupon);
    res.status(201).json(newCoupon);
};
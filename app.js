   const express = require('express');
   const app = express();
   app.use(express.json());

   class OrderStats {
     static totalOrders = 0;
     static revenue = 0;
     static lastCoupon = null;

     static record(result, couponCode) {
       OrderStats.totalOrders += 1;
       OrderStats.revenue += result.total;
       OrderStats.lastCoupon = couponCode;
     }
   }

   const PRODUCTS = {
     'sku-001': { name: 'Arabica Coffee 250g', price: 85000 },
     'sku-002': { name: 'Ceramic Mug', price: 45000 },
     'sku-003': { name: 'Manual Grinder', price: 350000 },
   };

   const COUPONS = {
     HEMAT10: { type: 'percent', value: 10, minSubtotal: 100000 },
     FLAT50K: { type: 'flat', value: 50000, minSubtotal: 0 },
   };

   function calculateTotal(items, couponCode) {
     let subtotal = 0;
     for (const item of items) {
       const product = PRODUCTS[item.sku];
       if (!product) throw new Error(`Unknown SKU: ${item.sku}`);
       subtotal += product.price * item.qty;
     }

     let discount = 0;
     const coupon = COUPONS[couponCode];
     if (coupon && subtotal >= coupon.minSubtotal) {
       discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
     }

     const tax = Math.round((subtotal - discount) * 0.11);
     return { subtotal, discount, tax, total: subtotal - discount + tax };
   }

   app.post('/checkout', (req, res) => {
     const { customer, items, coupon } = req.body;
     try {
       const result = calculateTotal(items, coupon);
       OrderStats.record(result, coupon);
       res.json({ customer, ...result });
     } catch (err) {
       res.status(400).json({ error: err.message });
     }
   });

   app.get('/health', (req, res) => res.send('ok'));

   app.listen(3000, () => console.log('ld-demo listening on :3000'));


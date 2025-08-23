
// scripts/fixOrdersUserRef.js
const mongoose = require('mongoose');
const Order = require('../models/orderModels');
const User = require('../models/userModel'); // تأكد إن المسار صحيح

// اتصال بقاعدة البيانات
mongoose.connect('mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');

  const orders = await Order.find({});

  let updatedCount = 0;

  for (const order of orders) {
    if (typeof order.user === 'string') {
      const userId = order.user;

      // ابحث عن الـ user الحقيقي
      const user = await User.findById(userId);

      if (user) {
        order.user = mongoose.Types.ObjectId(userId);
        await order.save();
        updatedCount++;
        console.log(`✅ Updated order ${order._id}`);
      } else {
        console.warn(`⚠️ No user found for order ${order._id}`);
      }
    }
  }

  console.log(`🎉 Finished. Updated ${updatedCount} orders.`);
  mongoose.disconnect();
}).catch(err => {
  console.error('❌ Connection error:', err);
});
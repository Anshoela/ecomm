import { sendLowStockAlert } from '../services/smsService.js';

const router = express.Router();

router.post('/check-inventory', (req, res) => {
  const { productId, productName, stockQuantity, updateLink } = req.body;

  // Check if stock is low (less than 10)
  if (stockQuantity < 10) {
    const adminPhone = '+1234567890';  // Admin phone number (replace with real number)
    const product = {
      name: productName,
      stock_quantity: stockQuantity,
      update_link: updateLink,
    };

    // Send low stock alert
    sendLowStockAlert(adminPhone, product);
    
    return res.status(200).json({ message: 'Low stock alert sent to admin.' });
  }

  return res.status(200).json({ message: 'Stock is sufficient.' });
});
export { router as inventoryRoutes };

import express from 'express';

export const router = express.Router();

// Get current fuel price (India)
router.get('/', async (req, res) => {
  try {
    // Mock fuel price for India (around ₹100 per litre)
    const mockPrice = {
      price: 100 + (Math.random() * 2 - 1), // Random price between ₹99-101
      currency: 'INR',
      unit: 'litre',
      timestamp: new Date().toISOString()
    };
    
    res.json(mockPrice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
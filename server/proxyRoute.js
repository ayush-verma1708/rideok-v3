import express from 'express';
import axios from 'axios';

const router = express.Router();

const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf62483628cb4427c2430b96c354f4d63058fd';

router.get('/directions', async (req, res) => {
  try {
    const { start, end } = req.query;
    const response = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
      params: {
        api_key: OPENROUTESERVICE_API_KEY,
        start,
        end,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error while fetching directions' });
  }
});

export default router;
const express = require('express');
const router = express.Router();
const { getAllSeats, bookSeats, resetBooking } = require('../controllers/seatController');

router.get('/', getAllSeats);
router.post('/book', bookSeats);
router.post('/reset', resetBooking);

module.exports = router;
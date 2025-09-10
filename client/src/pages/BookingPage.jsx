import React, { useState, useEffect, useCallback } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getSeats, bookSeats, resetSeats } from '../services/api.js'
import SeatLayout from '../components/SeatLayout.jsx'
import './BookingPage.css'

const BookingPage = () => {
  const [seats, setSeats] = useState([])
  const [numSeats, setNumSeats] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const showToast = (type, text) => {
    const opts = { position: 'top-right', autoClose: 2500 }
    if (type === 'success') return toast.success(text, opts)
    if (type === 'error') return toast.error(text, opts)
    return toast.info(text, opts)
  }

  const fetchSeats = useCallback(async () => {
    try {
      const data = await getSeats()
      setSeats(data)
    } catch (err) {
      showToast('error', 'Could not fetch seats from the server.')
    }
  }, [showToast])

  useEffect(() => {
    fetchSeats()
  }, [fetchSeats])

  const handleBooking = async (e) => {
    e.preventDefault()

    if (parseInt(numSeats) < 1 || parseInt(numSeats) > 7) {
      showToast('error', 'Please enter a number between 1 and 7.')
      return
    }

    try {
      setSubmitting(true)
      const res = await bookSeats(parseInt(numSeats))
      showToast('success', res.msg || 'Seats booked successfully!')
      setNumSeats('')
      fetchSeats()
    } catch (err) {
      showToast('error', err.response?.data?.msg || 'An error occurred during booking.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    try {
      const res = await resetSeats()
      showToast('info', res.msg)
      fetchSeats()
    } catch (err) {
      showToast('error', 'Failed to reset bookings.')
    }
  }

  const availableSeatsCount = seats.filter((s) => !s.is_booked).length
  const bookedSeatsCount = 80 - availableSeatsCount

  return (
    <div className="booking-container">
      <div className="seating-chart-container">
        <h1 className="title">Ticket Booking</h1>
        <SeatLayout seats={seats} />
        <div className="info-panel">
          <p>Booked Seats = {bookedSeatsCount}</p>
          <p>Available Seats = {availableSeatsCount}</p>
        </div>
      </div>

      <div className="controls-container">
        <form onSubmit={handleBooking} className="booking-form">
          <label htmlFor="numSeats">Book Seats</label>
          <input
            id="numSeats"
            type="number"
            min="1"
            max="7"
            value={numSeats}
            onChange={(e) => setNumSeats(e.target.value)}
            placeholder="e.g., 5"
            required
          />
          <button type="submit" className="btn book-btn" disabled={submitting}>
            {submitting ? 'Booking…' : 'Book'}
          </button>
        </form>

        <button onClick={handleReset} className="btn reset-btn">
          Reset Booking
        </button>

        <ToastContainer />
      </div>
      {submitting && <div className="overlay"><div className="spinner" /></div>}
    </div>
  )
}

export default BookingPage



import React from 'react';
import Seat from './Seat.jsx';
import './SeatLayout.css';

/**
 * Grid layout component for seat visualization
 * Renders 7 seats per row simply grid view
 */
const SeatLayout = ({ seats }) => {
  return (
    <div className="seat-layout">
      {seats.map(seat => (
        <Seat key={seat.id} seat={seat} />
      ))}
    </div>
  );
};

export default SeatLayout;



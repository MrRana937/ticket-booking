import React from 'react';

const Seat = ({ seat }) => {
  const getSeatClass = () => {
    if (seat.is_booked) {
      return 'seat booked';
    }
    return 'seat available';
  };

  return (
    <div className={getSeatClass()}>
      {seat.id}
    </div>
  );
};

export default Seat;



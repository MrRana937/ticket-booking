import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/seats';

export const getSeats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching seats:', error);
    throw error;
  }
};

export const bookSeats = async (numSeats) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/book`, {
      numSeats,
    });
    return response.data;
  } catch (error) {
    console.error('Error booking seats:', error);
    throw error;
  }
};

export const resetSeats = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reset`);
    return response.data;
  } catch (error) {
    console.error('Error resetting seats:', error);
    throw error;
  }
};

import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://d3kf6j33-8000.inc1.devtunnels.ms/api';

export const axiosClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

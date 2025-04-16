import axios from 'axios';

const wristbandApiClient = axios.create({
  withXSRFToken: true,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export default wristbandApiClient;

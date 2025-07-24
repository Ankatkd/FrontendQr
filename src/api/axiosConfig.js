import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api", // Adjust if backend is hosted elsewhere
});

export default instance;

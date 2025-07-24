import { io } from "socket.io-client";

const socket = io("http://localhost:8085"); // backend server URL
export default socket;
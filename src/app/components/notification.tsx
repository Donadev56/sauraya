import React from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export type NotificationStatus = "success" | "error" | "info" | "warning";

interface NotificationProps {
  message: string;
  status: NotificationStatus;
}

export const showNotification = ({ message, status }: NotificationProps) => {
  toast[status](message);
};

const Notification = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false} 
      newestOnTop={true}
      closeOnClick={true} 
      pauseOnHover={true} 
      draggable={true}
      theme="dark" 
    />
  );
};

export default Notification;

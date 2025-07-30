import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomAlertDialog = ({ message, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center border-t-4 border-indigo-600"
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 50 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Notification</h3>
                        <p className="text-gray-700 mb-6">{message}</p>
                        <button
                            onClick={onClose}
                            className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200 ease-in-out shadow-md"
                        >
                            OK
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CustomAlertDialog;

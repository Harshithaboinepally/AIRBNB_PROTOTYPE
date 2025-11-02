import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="error-message">
            <span>{message}</span>
            {onClose && (
                <button onClick={onClose} className="error-close-btn">
                    &times;
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;
import React from 'react';

const Toast = ({ variant = 'info', message, onClose, style }) => {
    const baseClasses = "fixed right-4 flex items-center p-4 rounded-lg shadow-lg min-w-[300px] z-50 text-[var(--dark)]";
    const iconBaseClasses = "w-8 h-8";
    const closeButtonClasses = "ml-auto -mx-1.5 -my-1.5 bg-transparent text-[var(--dark)] rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8";

    const variantClasses = {
        info: "bg-[var(--primary)]",
        success: "bg-[var(--success)]",
        warning: "bg-[var(--warning)]",
        error: "bg-[var(--danger)]",
    };

    const icons = {
        info: (
            <svg className={iconBaseClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
        ),
        success: (
            <svg className={iconBaseClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
        warning: (
            <svg className={iconBaseClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
        ),
        error: (
            <svg className={iconBaseClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]}`} style={style}>
            <div className="flex-shrink-0 mr-3">
                {icons[variant]}
            </div>
            <p className="text-sm font-normal">{message}</p>
            <button type="button" className={`${closeButtonClasses} hover:bg-white hover:bg-opacity-20`} onClick={onClose}>
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;
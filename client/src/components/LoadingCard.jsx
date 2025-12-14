
import React from 'react';
import Card from './Card';

const LoadingCard = ({ message }) => {
    return (
        <Card title="" className="p-6 mt-6 w-100 h-full flex flex-col space-y-4 transition duration-500">
            <div className="space-y-4 pt-4">
                <div className="flex flex-col items-center justify-center">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-black dark:text-gray-300">Loading...</h2>
                    </div>
                    <svg className="animate-spin h-16 w-16 text-black dark:text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-black dark:text-white text-lg">{message}</p>
                </div>
            </div>
        </Card>
    );
};

export default LoadingCard;

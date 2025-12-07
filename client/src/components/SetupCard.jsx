import React, { useState, useContext } from 'react';
import Card from './Card';
import PlayerContext from '../contexts/PlayerContext';

// Lobby view for joining or creating a game
const SetupCard = ({ onCreateRoom, onJoinRoom }) => {
    
    // has properties from closest parent context: playerName, setPlayerName, roomCode, setRoomCode
    const playerContextObj = useContext(PlayerContext); 
    
    return (
        <Card title="" className="p-6 h-full flex flex-col space-y-8">
            <div className="space-y-4 pt-4 pb-8 border-b border-gray-900 dark:border-gray-700">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-black dark:text-gray-300">Welcome!</h2>
                    <p className="text-black dark:text-gray-300 mt-2">Enter your name to begin.</p>
                </div>
                <div className="flex justify-center gap-4">
                    <input type="text" placeholder="Your Name" id='name'
                        value={playerContextObj.playerName} maxLength={20}
                        onChange={(e) => playerContextObj.setPlayerName(e.target.value)}
                        className="p-3 bg-gray-200 dark:bg-gray-700 border border-gray-900 dark:border-gray-600 rounded-lg text-black dark:text-white"
                    />
                    <button onClick={() => onCreateRoom(playerContextObj.playerName)} // anonymous function to pass name value
                        className={`flex items-center justify-center gap-2 space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 
                        shadow-md ${!playerContextObj.playerName ? 'bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 hover:cursor-pointer'}`}
                        disabled={!playerContextObj.playerName}>
                        Create Room
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex">
                <span className="mx-auto text-black dark:text-gray-300">Or</span>
            </div>
                
            <div className="space-y-4 pt-4 border-t border-gray-900 dark:border-gray-700">
                <div className="text-center mb-8">
                    <p className="text-black dark:text-gray-300 mt-2">Join with Code</p>
                </div>
                <div className="flex justify-center gap-4">
                    <input type="text" maxLength="4" placeholder="0000" id='code'
                        value={playerContextObj.roomCode}
                        onChange={(e) => playerContextObj.setRoomCode(e.target.value.toUpperCase())}
                        className="p-3 bg-gray-200 dark:bg-gray-700 border border-gray-900 dark:border-gray-600 rounded-lg text-black dark:text-white"
                    />
                    <button onClick={() => { onJoinRoom(playerContextObj.roomCode, playerContextObj.playerName); }} // anonymous function to pass name and code values
                        className={`flex items-center justify-center gap-2 space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 
                            shadow-md ${(playerContextObj.roomCode.length !== 4) || (!playerContextObj.playerName) ? 'bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 hover:cursor-pointer'}`}
                        disabled={playerContextObj.roomCode.length !== 4 || !playerContextObj.playerName} >
                        Join Room
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
                        </svg>


                    </button>
                </div>
            </div>

        </Card>
    )
};

export default SetupCard;

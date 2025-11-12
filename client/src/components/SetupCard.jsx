import React, { useState, useContext } from 'react';
import Card from './Card';
import PlayerContext from '../contexts/PlayerContext';

// Lobby view for joining or creating a game
const SetupCard = ({ onCreateRoom, onJoinRoom }) => {
    
    // has properties from closest parent context: playerName, setPlayerName, roomCode, setRoomCode
    const playerContextObj = useContext(PlayerContext); 
    
    return (
        <Card title="" className="p-6 h-full flex flex-col space-y-8">
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-300 flex items-center space-x-2">
                    <label htmlFor="name">User Name</label>
                </h3>
                <input type="text" placeholder="Your Name" id='name'
                    value={playerContextObj.playerName}
                    onChange={(e) => playerContextObj.setPlayerName(e.target.value)}
                    className="col-span-3 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
            </div>
                
            <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-xl font-semibold text-gray-300 flex items-center space-x-2">
                    <span>Join Game</span>
                </h3>
                <div className="grid grid-cols-4 gap-3">
                    <input type="text" maxLength="4" placeholder="0000" id='code'
                        value={playerContextObj.roomCode}
                        onChange={(e) => playerContextObj.setRoomCode(e.target.value.toUpperCase())}
                        className="col-span-3 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <button onClick={()=> {onJoinRoom(playerContextObj.roomCode, playerContextObj.playerName);
                        console.log(`[DEBUG] Joining room ${playerContextObj.roomCode} as ${playerContextObj.playerName}`);
                    }} // anonymous function to pass name and code values
                        className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 
                            shadow-md ${(playerContextObj.roomCode.length !== 4) || (!playerContextObj.playerName) ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-400 hover:bg-blue-500 hover:cursor-pointer'}`}
                        disabled={playerContextObj.roomCode.length !== 4 || !playerContextObj.playerName} >
                        Join
                    </button>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-xl font-semibold text-gray-300 flex items-center space-x-2">
                    <span>Create Game</span>
                </h3>
                <div className="grid grid-cols-4 gap-3">
                    <button onClick={()=> onCreateRoom(playerContextObj.playerName)} // anonymous function to pass name value
                        className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition duration-200 
                            shadow-md ${!playerContextObj.playerName ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-400 hover:bg-blue-500 hover:cursor-pointer'}`}
                        disabled={!playerContextObj.playerName}>
                        Create
                    </button>
                </div>
            </div>
        </Card>
    )
};

export default SetupCard;

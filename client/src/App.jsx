
import './App.css'
import React, { useState, useEffect } from 'react';
import Card from './components/Card';
import SetupCard from './components/SetupCard';
import PlayerCard from './components/PlayerCard';
import ActionsCard from './components/ActionsCard';
import RoomChatCard from './components/RoomChatCard';
import VoteCard from './components/VoteCard';
import LocationsCard from './components/LocationsCard';
import { socket, createRoom, joinRoom, startGame, vote, callVote, spyGuessLocation, getLocations} from './socket.js';

// --- Main App Component ---
const App = () => {
    const [view, setView] = useState('lobby'); // 'lobby', 'room', 'in-progress','vote'

    const [voteCountdownTargetDate, setVoteCountdownTargetDate] = useState(null);
    const [gameCountdownTargetDate, setGameCountdownTargetDate] = useState(null);
    const [countdownTime, setCountdownTime] = useState(0);

    const [roomChat, setRoomChat] = useState(["Welcome to the room!"]);
    const [playerList, setPlayerList] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [locationsArr, setLocationsArr] = useState([]);

    const [role, setRole] = useState(''); // player's role
    const [location, setLocation] = useState(''); // player's location

    //get locations on initial load
    useEffect(() => {
        getLocations();
    }, []);

    // vote countdown timer effect
    useEffect(() => {
        const startSec = Math.floor((voteCountdownTargetDate - new Date()) / 1000);
        setCountdownTime(startSec);
        const timer = setInterval(() => {
            setCountdownTime(countdownTime - 1);
        }, 1000);

        return () => clearInterval(timer); // Cleanup on unmount
    }, [voteCountdownTargetDate]);

    // game countdown timer effect
    useEffect(() => {
        const startSec = Math.floor((gameCountdownTargetDate - new Date()) / 1000);
        setCountdownTime(startSec);
        const timer = setInterval(() => {
            setCountdownTime(countdownTime - 1);
        }, 1000);

        return () => clearInterval(timer); // Cleanup on unmount
    }, [gameCountdownTargetDate]);

    //on first mount, setup socket event listeners
    useEffect(() => {
        socket.on('message', (data) => {
            switch (data.type) {
                case 'error':
                    console.log('An error occurred. ' + data.message);
                    alert('An error occurred: ' + data.message);
                    break;
                case 'announcement':
                    setRoomChat(prev => [...prev, data.message]);
                    break;
                case 'roomCreated':
                    //get room code from server, then emit joinRoom to server
                    setRoomChat(prev => [...prev, data.message]);
                    localStorage.setItem('SpyfallRoomCode', data.roomCode);
                    joinRoom(data.roomCode, playerName);
                    break;
                case 'roleAssigned':
                    setRole(data.role);
                    if (data.role === 'Spy') {
                        setLocation('You are the Spy!');
                    } else {
                        setLocation(data.location);
                    }
                    break;
                case 'resetRoom':
                    setView('room');
                    setRoomChat(prev => [...prev, data.message]);
                    setRole('');
                    setLocation('');
                    break;
                case 'locationsList':
                    setLocationsArr(data.locations); //array of objs
                    break;
                case 'joinedRoom':
                    setView('room');
                    setRoomChat(prev => [...prev, data.message]);
                    localStorage.setItem('SpyfallRoomCode', data.roomCode);
                    localStorage.setItem('SpyfallPlayerCode', data.playerCode);
                    setPlayerList(data.playerList);
                    break;
                case 'playerJoined':
                    setRoomChat(prev => [...prev, data.message]);
                    setPlayerList(prev => [...prev, { name: data.playerName, isHost: false }]);// append new player to list
                    break;
                case 'playerLeftRoom':
                    setRoomChat(prev => [...prev, data.message]);
                    //update player list
                    setPlayerList(prev => prev.filter(p => p.name !== data.playerLeftName));
                    //update host status if needed
                    if (data.newHostName) {
                        setPlayerList(prev => prev.map(p => p.name === data.newHostName ? { ...p, isHost: true } : p));
                    }
                    break;
                case 'voteCalled':
                    setView('vote');
                    setRoomChat(prev => [...prev, data.message]);
                    setVoteCountdownTargetDate(new Date(data.endDate));
                    break;
                case 'gameStarted':
                    setView('in-progress');
                    setRoomChat(prev => [...prev, data.message]);
                    setGameCountdownTargetDate(new Date(data.endDate));
                    break;
                case 'leftRoom':
                    setView('lobby');
                    setRoomChat(["Welcome to the room!"]);
                    localStorage.removeItem('SpyfallRoomCode');
                    localStorage.removeItem('SpyfallPlayerCode');
                    console.log(data.message);
                    break;
                default:
                    break;
            }
        });

        return () => {
            // Cleanup event listeners on unmount
            socket.off('message');
        };
    }, []);



    const renderView = () => {
       
        switch(view) {
            case 'lobby':
                return <div className="grid grid-cols-1 gap-6 w-fit h-fit p-4">
                    <SetupCard onCreateRoom={createRoom} onJoinRoom={joinRoom} onPlayerNameChange={setPlayerName} playerName={playerName}/>
                    {/* <LocationsCard locationsArr={locationsArr}/> */}
                </div>
            case 'room': 
                return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full h-full p-4 lg:p-8">
                    <button onClick={() => {
                            socket.emit('leaveRoom', {
                                roomCode: localStorage.getItem('SpyfallRoomCode'),
                                playerCode: localStorage.getItem('SpyfallPlayerCode')
                            });
                            setView("lobby");
                            setRoomChat(["Welcome to the room!"]);
                            localStorage.removeItem('SpyfallRoomCode');
                            localStorage.removeItem('SpyfallPlayerCode');
                        }}
                        className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-600 text-white 
                        py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md z-10">
                        Leave Room
                    </button>
                    {/* Left Column: Player Card (Location/Role Display) and action card (middle)*/}
                    <div className="lg:col-span-1 flex flex-col space-y-6">
                        {/* <PlayerCard isSpy={isSpy} location={location} role={role} /> */}
                        <ActionsCard timeLeft={countdownTime} playerList={playerList}/>
                    </div>
                    {/* Middle Column: RoomChatHistory (middle) */}
                    <div className="lg:col-span-1 flex flex-col space-y-6">
                        <RoomChatCard roomChat={roomChat}/>
                    </div>
                    {/* Right Column: Locations card (right) */}
                    <div className="lg:col-span-1 flex flex-col space-y-6">
                        <LocationsCard locationsArr={locationsArr}/>
                    </div>
                </div>
            case 'in-progress':
                return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full h-full p-4 lg:p-8">
                    <button onClick={() => {
                            socket.emit('leaveRoom', {
                                roomCode: localStorage.getItem('SpyfallRoomCode'),
                                playerCode: localStorage.getItem('SpyfallPlayerCode')
                            });
                        }}
                        className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-600 text-white 
                        py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md z-10">
                        Leave Room
                    </button>
                    {/* Left Column: Player Card (Location/Role Display) and action card (middle)*/}
                    <div className="lg:col-span-1 flex flex-col space-y-6">
                        <PlayerCard isSpy={isSpy} location={location} role={role} />
                        <ActionsCard timeLeft={countdownTime} playerList={playerList}/>
                    </div>
                    {/* Middle Column: RoomChatHistory (middle) */}
                    <div className="lg:col-span-1 flex flex-col space-y-6">
                        <RoomChatCard roomChat={roomChat}/>
                    </div>
                    {/* Right Column: Locations card (right) */}
                    <div className="lg:col-span-1 flex flex-col space-y-6">
                        <LocationsCard locationsArr={locationsArr}/>
                    </div>
                </div>
            case 'vote':
                return <div className="grid grid-cols-1 gap-6 w-full h-full p-4">
                    <VoteCard playerList={playerList} onVote={vote}/>                    
                </div>
            default:
                return <div>
                    <h1>Unknown View</h1>                    
                </div>
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4">
            {/* Global Style and Theme Setup */}
            <style>{`
        /* Custom scrollbar for a darker theme */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1f2937; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}</style>

            <main className="w-full max-w-6xl h-[90vh] flex flex-col">
                <section className="flex-grow overflow-auto rounded-b-xl">
                    {renderView()}
                </section>
            </main>
        </div>
    );
};

export default App;


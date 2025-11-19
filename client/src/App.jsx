
import './App.css'
import React, { useState, useEffect, useRef, useContext } from 'react';
import PlayerContext from './contexts/PlayerContext'; // object context for player info, holds getters and setters

import SetupCard from './components/SetupCard';
import PlayerCard from './components/PlayerCard';
import ActionsCard from './components/ActionsCard';
import RoomChatCard from './components/RoomChatCard';
import VoteCard from './components/VoteCard';
import LocationsCard from './components/LocationsCard';

import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';
const socket = io(URL);

// --- Main App Component ---
const App = () => {
    const [view, setView] = useState('lobby'); // 'lobby', 'room', 'in-progress','vote'

    const [voteCountdownTargetDate, setVoteCountdownTargetDate] = useState(null);
    const [gameCountdownTargetDate, setGameCountdownTargetDate] = useState(null);
    const [countdownTime, setCountdownTime] = useState(0);

    const [roomChat, setRoomChat] = useState(["Welcome to the room!"]);
    const [locationsArr, setLocationsArr] = useState([]);
    const [playerList, setPlayerList] = useState([]);

    const [playerName, setPlayerName] = useState('');
    const [playerCode, setPlayerCode] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [role, setRole] = useState(''); // player's role
    const [location, setLocation] = useState(''); // player's location
    const playerNameRef = useRef(playerName);

    const sendChatMessage = (message) => {
        socket.emit('chatMessage', { roomCode, playerCode, message }, response => {
            if (response.status !== 'success') {
                // mark message as failed to send
                setRoomChat(prev => [...prev, "*Error sending previous message*"]);
            } else {// else success and update roomchat
                setRoomChat(prev => [...prev, playerNameRef.current + ": " + message]);
            }
        });
    }

    const createRoom = () => {
        socket.emit('createRoom', response);
        if (response.status !== 'success') {
            console.error("Error creating room.");
            alert("Error creating room. Please try again.");
        } else { // else success
            //get room code from server, then emit joinRoom to server
            setRoomCode(response.roomCode);
            setRoomChat(prev => [...prev, "Created room " + response.roomCode]);
            joinRoom(data.roomCode, playerNameRef.current);
        }
    };

    const joinRoom = (roomCode, inputName) => {
        socket.emit('joinRoom', { roomCode, inputName }, response);
        if (response.status !== 'success') {
            console.error("Error joining room.");
            alert("Error joining room. Please try again.");
        } else { // else success
            setView('room');
            setRoomChat(prev => [...prev, "Joined room " + roomCode]);
            setRoomCode(data.roomCode);
            setPlayerCode(data.playerCode);
            setPlayerList(data.playerList);
        }
    };

    const leaveRoom = (roomCode, playerCode) => {
        socket.emit('leaveRoom', { roomCode, playerCode }, response);
        if (response.status !== 'success') {
            console.error("Error leaving room.");
            alert("Error leaving room. Please try again.");
        } else { // else success
            setView('lobby');
            setRoomChat(["Welcome to the room!"]);
            console.log("You have left room " + roomCode);
        }
    }

    const startGame = (roomCode, name) => {
        socket.emit('startGame', { roomCode, name }, response);
        if (response.status !== 'success') {
            console.error("Error starting game.");
            alert("Error starting game. Please try again.");
        } else { // else success
            setView('in-progress');
            setRoomChat(prev => [...prev, "Game has started!"]);
            setGameCountdownTargetDate(new Date(response.endDate));
        }
    };

    const vote = (roomCode, playerCode, votedFor) => {
        socket.emit('vote', { roomCode, playerCode, votedFor }, response);
        if (response.status !== 'success') {
            console.error("Error submitting vote.");
            alert("Error submitting vote. Please try again.");
        } else { // else success
            setRoomChat(prev => [...prev, "You have voted for " + votedFor]);
        }
    };

    const callVote = (roomCode, name) => {
        socket.emit('callVote', { roomCode, name }, response);
        if (response.status !== 'success') {
            console.error("Error calling vote.");
            alert("Error calling vote. Please try again.");
        } else { // else success
            setView('vote');
            setRoomChat(prev => [...prev, data.message]);
            setVoteCountdownTargetDate(new Date(data.endDate));
        }
    };

    const spyGuessLocation = (roomCode, playerCode, guessedLocation) => {
        socket.emit('spyGuessLocation', { roomCode, playerCode, guessedLocation }, response);
        if (response.status !== 'success') {
            console.error("Error submitting location guess.");
            alert("Error submitting location guess. Please try again.");
        } else { // else success
            if (response.correct) {
                setRoomChat(prev => [...prev, "Spy guessed the location correctly! It was " + guessedLocation]);
                
            } else {
                setRoomChat(prev => [...prev, "Spy guessed the location incorrectly. It was not " + guessedLocation]);
            }
            setRoomChat(prev => [...prev, "The Spy was " + response.spyName]);
            setRoomChat(prev => [...prev, "Game over!"]);
            setView('room');
        }
    };

    const getLocations = () => {
        socket.emit('getLocations', response);
        if (response.status !== 'success') {
            console.error("Error fetching locations.");
            alert("Error fetching locations. Please try again.");
        } else { // else success
            setLocationsArr(response.locations); //array of objs
        }
    };


    useEffect(() => {
        playerNameRef.current = playerName;
    }, [playerName]);

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
                case 'roleAssigned':
                    setRole(data.role);
                    if (data.role === 'Spy') {
                        setLocation('Unknown');
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
                case 'playerJoined':
                    setRoomChat(prev => [...prev, data.message]);
                    setPlayerList(prev => [...prev, { name: data.playerName, isHost: false }]);// any player that joins cannot be host
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
                    <PlayerContext.Provider value={{ playerName, setPlayerName,  roomCode, setRoomCode }}> {/*pass as object */}
                        <SetupCard onCreateRoom={createRoom} onJoinRoom={joinRoom} />
                    </PlayerContext.Provider>
                </div>
            case 'room': 
                return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full h-full p-4 lg:p-8">
                    <PlayerContext.Provider value={{roomCode, playerName}}>
                        <button onClick={() => {leaveRoom(roomCode, playerCode);
                            console.log(`[DEBUG] Leaving room ${roomCode} as ${playerName}`);
                        }} // wait for leftRoom handler to get response
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
                            <RoomChatCard roomChat={roomChat} sendChatMessage={sendChatMessage}/>
                        </div>
                            {/* Right Column: Locations card (right) */}
                        <div className="lg:col-span-1 flex flex-col space-y-6">
                            <LocationsCard locationsArr={locationsArr}/>
                        </div>
                    </PlayerContext.Provider>
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


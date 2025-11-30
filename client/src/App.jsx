
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
    const [theme, setTheme] = useState('dark');

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
        socket.emit('createRoom', function(response) {
            if (response.status !== 'success') {
                console.error("Error creating room.");
                alert("Error creating room. Please try again.");
            } else { // else success
                //get room code from server, then emit joinRoom to server
                setRoomCode(response.roomCode);
                setRoomChat(prev => [...prev, "Created room " + response.roomCode]);
                joinRoom(response.roomCode, playerNameRef.current);
            }
        });
    };

    const joinRoom = (roomCode, inputName) => {
        socket.emit('joinRoom', { roomCode, inputName }, function(response) {
            if (response.status !== 'success') {
                console.error("Error joining room. " + response.message);
                alert("Error joining room. Please try again. " + response.message);
            } else { // else success
                setView('room');
                setPlayerName(response.playerName); //returned name could be different
                setRoomChat(prev => [...prev, "Joined room " + roomCode]);
                setRoomCode(response.roomCode);
                setPlayerCode(response.playerCode);
                setPlayerList(response.playerList);
            }
        });
    };

    const leaveRoom = (roomCode, playerCode) => {
        socket.emit('leaveRoom', { roomCode, playerCode }, function(response) {
            if (response.status !== 'success') {
                console.error("Error leaving room. " + response.message);
                setRoomChat(prev => [...prev, "Error leaving room. " + response.message]);
            } else { // else success
                setView('lobby');
                setRoomChat(["Welcome to the room!"]);
                console.log(response.message);
            }
        });
    }

    const startGame = (roomCode, playerCode) => {
        socket.emit('startGame', { roomCode, playerCode }, function(response) {
            if (response.status !== 'success') {
                console.error("Error starting game. " + response.message);
                setRoomChat(prev => [...prev, "Error starting game. " + response.message]);
            } else { // else success
                //wait for gameStarted event from server to update view and other info
                setRoomChat(prev => [...prev, "Game is starting..."]);
            }
        });
    };

    const vote = (roomCode, playerCode, votedFor) => {
        socket.emit('vote', { roomCode, playerCode, votedFor }, function(response) {
            if (response.status !== 'success') {
                console.error("Error submitting vote. " + response.message);
                setRoomChat(prev => [...prev, "Error submitting vote. " + response.message]);
            } else { // else success
                setRoomChat(prev => [...prev, "You have voted for " + votedFor]);
            }
        });
    };

    const callVote = (roomCode, playerCode) => {
        socket.emit('callVote', { roomCode, playerCode }, function(response) {
            if (response.status !== 'success') {
                console.error("Error calling vote.");
                setRoomChat(prev => [...prev, response.message]);
            } else { // else success
                setView('vote');
                setRoomChat(prev => [...prev, response.message]);
                setVoteCountdownTargetDate(new Date(response.endDate));
            }
        });
    };

    const spyGuessLocation = (roomCode, playerCode, guessedLocation) => {
        socket.emit('spyGuessLocation', { roomCode, playerCode, guessedLocation }, function(response) {
            if (response.status !== 'success') {
                console.error("Error submitting location guess. " + response.message);
                setRoomChat(prev => [...prev, "Error submitting location guess. " + response.message]);
            } else { // else success
                //let server send announcement of result
                
            }
        });
    };

    const getLocations = () => {
        socket.emit('getLocations', function(response) {
            if (response.status !== 'success') {
                console.error("Error fetching locations.");
                alert("Error fetching locations. Please try again.");
            } else { // else success
                setLocationsArr(response.locations); //array of objs
            }
        });
    };


    useEffect(() => {
        playerNameRef.current = playerName;
    }, [playerName]);

    //get locations on initial load
    useEffect(() => {
        try {
            getLocations();
            
        } catch (error) {
            console.log("Unable to get locations. Server might not be online. " + error.message);
        }
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
                case 'gameStarted':
                    setView('in-progress');
                    setRoomChat(prev => [...prev, data.message]);
                    setGameCountdownTargetDate(new Date(data.endDate));
                    break;
                case 'roleAssigned':
                    setRole(data.role);
                    setLocation(data.location);
                    //popup alert to show role and location
                    alert(`Your role is: ${role}\nYour location is: ${location}`);
                    break;
                case 'voteCalled':
                    setView('vote');
                    setRoomChat(prev => [...prev, data.message]);
                    setVoteCountdownTargetDate(new Date(data.endDate));
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

    // check if theme light/dark theme exists in localstorage
    useEffect(() => {
        const exists = localStorage.getItem('theme');
        if (exists){
            setTheme(exists)
        }
    },[]);

    // if theme changes, add or remove dark class
    useEffect(() => {
        if (theme === 'dark') {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else if (theme === 'light'){
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }

    },[theme]);

    // function to toggle themes
    const toggleTheme = () => {
        if (theme === 'light') 
            { setTheme('dark'); }
        else if (theme === 'dark') 
            { setTheme('light'); }
    }

    const renderView = () => {
       
        switch(view) {
            case 'lobby':
                return <div className="grid grid-cols-1 gap-6 w-fit h-fit p-4">
                    <PlayerContext.Provider value={{ playerName, setPlayerName,  roomCode, setRoomCode }}> {/*pass as object */}
                        <SetupCard onCreateRoom={createRoom} onJoinRoom={joinRoom} />
                    </PlayerContext.Provider>
                </div>
            case 'room': 
                return <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-8 lg:mx-auto">
                    <PlayerContext.Provider value={{roomCode, playerName}}>
                            {/* Left Column: action card */}
                        <div className="col-span-1 space-y-6">
                            <button onClick={() => {leaveRoom(roomCode, playerCode);
                            }} // wait for leftRoom handler to get response
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white 
                                py-2 px-4 mx-auto rounded-lg font-medium transition duration-200 shadow-md">
                                Leave Room
                            </button>
                            <div className="text-center mb-6">
                                <p className="text-gray-600 dark:text-gray-400">Room Code</p>
                                <h2 className="text-5xl font-extrabold tracking-widest text-baby-blue-600 dark:text-baby-blue-400 select-all">{roomCode}</h2>
                                <p className="text-gray-500 dark:text-gray-500 mt-2">Share this code with your friends!</p>
                            </div>
                            
                            <ActionsCard timeLeft={countdownTime} playerList={playerList} onStartGame={startGame}/>
                        </div>
                            {/* Middle Column: RoomChatHistory (middle) */}
                        <div className="col-span-1 lg:col-span-3 space-y-6">
                            <RoomChatCard roomChat={roomChat} sendChatMessage={sendChatMessage}/>
                        </div>
                            {/* Second row */}
                        <div className="col-span-1 lg:col-span-2 lg:col-start-2 space-y-6">
                            <LocationsCard locationsArr={locationsArr}/>
                        </div>
                    </PlayerContext.Provider>
                </div>
            case 'in-progress':
                return <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-8 lg:mx-auto">
                    <PlayerContext.Provider value={{roomCode, playerName}}>
                        
                            {/* Left Column: Player Card (Location/Role Display) and action card (middle)*/}
                        <div className="col-span-1 space-y-6">
                            <button onClick={() => { leaveRoom(roomCode, playerCode);
                                }} // wait for leftRoom handler to get response
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white 
                                py-2 px-4 mx-auto rounded-lg font-medium transition duration-200 shadow-md">
                                Leave Room
                            </button>
                            <PlayerCard location={location} role={role}/>
                            <ActionsCard timeLeft={countdownTime} playerList={playerList} onStartGame={startGame}/>
                        </div>
                            {/* Middle Column: RoomChatHistory (middle) */}
                        <div className="col-span-1 lg:col-span-3 space-y-6">
                            <RoomChatCard roomChat={roomChat} sendChatMessage={sendChatMessage}/>
                        </div>
                            {/* Right Column: Locations card (right) */}
                        <div className="col-span-1 lg:col-span-2 lg:col-start-2 space-y-6">
                            <LocationsCard locationsArr={locationsArr}/>
                        </div>
                    </PlayerContext.Provider>
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
        <div className="min-h-screen bg-gray-300 dark:bg-gray-900 text-black dark:text-white font-sans flex flex-col items-center justify-center pt-4 px-4">
            <div className='fixed top-0 flex w-full bg-cyan-500 dark:bg-cyan-900 shadow-xl p-4 items-center justify-between'>
                <h1 className='text-xl text-black dark:text-white'>Spyfall</h1>
                <button className="rounded-l" onClick={toggleTheme}>
                    {theme === 'dark' ?
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                        </svg>
                        :
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                        </svg>
                    }
                </button>
            </div>
            {/* Global Style and Theme Setup */}
            <style>{`
                /* Custom scrollbar for a darker theme */
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #1f2937; }
                ::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
            `}</style>

            <main className="w-full h-[calc(100vh-64px)] flex flex-col">
                {renderView()}
            </main>
        </div>
    );
};

export default App;


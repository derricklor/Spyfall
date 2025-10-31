
import './App.css'
import React, { useState, useEffect } from 'react';
import Card from './components/Card';
import SetupCard from './components/SetupCard';
import PlayerCard from './components/PlayerCard';
import ActionsCard from './components/ActionsCard';
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

    useEffect(() => {
        // put error messages in console/popup
        socket.on('error', (data) => {
            console.log('An error occurred. ' + data.message);
        });

        // Handle announcements from the server 
        socket.on('announcement', (data) => {
            //append message to room chat
            setRoomChat(prev => [...prev, data.message]);
        });

        //handle locationsList from server
        socket.on('locationsList', (data) => {
            // store locations

            console.log('Received locations: ', data.locations);
            setLocationsArr(data.locations); //array of objs
        });

        //handle vote called from server and switch to vote view
        socket.on('voteCalled', (data) => {
            setView('vote');
            setRoomChat(prev => [...prev, data.message]);
            setVoteCountdownTargetDate(new Date(data.endDate));
        });

        //handle joined room from server and switch to room view
        socket.on('joinedRoom', (data) => {
            setView('room');
            setRoomChat(prev => [...prev, data.message]);
            localStorage.setItem('SpyfallRoomCode', data.roomCode);
            localStorage.setItem('SpyfallPlayerCode', data.playerCode);
            setPlayerList(data.playerList);
        });

        //handle player joined announcement and update player list
        socket.on('playerJoined', (data) => {
            setRoomChat(prev => [...prev, data.message]);
            setPlayerList(prev => [...prev, { name: data.playerName, isHost: false }]);// append new player to list
        });

        //handle game started from server and switch to in-progress view
        socket.on('gameStarted', (data) => {
            setView('in-progress');
            setRoomChat(prev => [...prev, data.message]);
            setGameCountdownTargetDate(new Date(data.endDate));
        });

        //handle reset room from server and switch to waiting view
        socket.on('resetRoom', (data) => {
            // clear role and location
            setView('room');
            setRoomChat(prev => [...prev, data.message]);
        });

        //handle left room from server and switch to lobby view
        socket.on('leftRoom', (data) => {
            setView('lobby');
            // clear room chat
            setRoomChat(["Welcome to the room!"]);
            localStorage.removeItem('SpyfallRoomCode');
            localStorage.removeItem('SpyfallPlayerCode');
            console.log(data.message);
        });

        return () => {
            socket.off('error');
            socket.off('announcement');
            socket.off('locationsList');
            socket.off('voteCalled');
            socket.off('joinedRoom');
            socket.off('playerJoined');
            socket.off('gameStarted');
            socket.off('resetRoom');
            socket.off('leftRoom');
        };
    }, []);


    const onStartGame = () => setView('game');
    const onGoToLobby = () => setView('lobby');
    const onToggleRole = () => setIsSpy(prev => !prev);


    // The main layout for the game view
    const GameView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full h-full p-4 lg:p-8">
            <button
                onClick={onGoToLobby}
                className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-600 text-white 
                py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md z-10">
                Back to Lobby
            </button>
            <button
                onClick={onToggleRole}
                className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white 
                py-2 px-4 rounded-lg font-medium transition duration-200 shadow-md z-10">
                Toggle Role
            </button>

            {/* Left Column: Player Card (Location/Role Display) */}
            <div className="lg:col-span-1 flex flex-col space-y-6">
                <PlayerCard isSpy={isSpy} location={location} role={role} />
            </div>

            {/* Middle/Right Column: action card (middle) and Locations card (right) */}
            <div className="lg:col-span-2 flex flex-col space-y-6">

                {/* In-game control panel on large screens, side-by-side with locations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <div className="flex flex-col">
                        <div className="flex-grow">
                            <ActionsCard timeLeft={countdownTime}/>
                        </div>
                    </div>
                    <div className="flex-grow">
                        placeholder
                    </div>
                </div>


            </div>
        </div>
    );

    const renderView = () => {
       
        switch(view) {
            case 'lobby':
                return <div>
                    <SetupCard onCreateRoom={createRoom} onJoinRoom={joinRoom} onPlayerNameChange={setPlayerName}/>
                    <LocationsCard locationsArr={locationsArr}/>
                </div>
            case 'room': 
                return <div>
                    <PlayerCard isSpy={isSpy} location={location} role={role} />
                    <LocationsCard locationsArr={locationsArr}/>
                </div>
            case 'in-progress':
                return <div>
                    <PlayerCard isSpy={isSpy} location={location} role={role} />
                    <ActionsCard timeLeft={countdownTime} playerList={playerList}/>
                    <LocationsCard locationsArr={locationsArr}/>
                </div>
            case 'vote':
                return <div>
                    <VoteView playerList={playerList} roomChat={roomChat} countdownTime={countdownTime} vote={vote} playerName={playerName}/>
                    
                </div>
            default:
                return <div>
                    <SetupCard onCreateRoom={createRoom} onJoinRoom={joinRoom} onPlayerNameChange={setPlayerName}/>
                    
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


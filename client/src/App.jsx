import './App.css'
import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import PlayerContext from './contexts/PlayerContext'; // object context for player info, holds getters and setters
// possibly add a RoomContext to hold room state information, simplifying the amount of global vars

import SetupCard from './components/SetupCard';
import PlayerCard from './components/PlayerCard';
import ActionsCard from './components/ActionsCard';
import RoomChatCard from './components/RoomChatCard';
import VoteCard from './components/VoteCard';
import LocationsCard from './components/LocationsCard';
import RevealRoleCard from './components/RevealRoleCard';
import SpyGuessCard from './components/SpyGuessCard';
import LoadingCard from './components/LoadingCard';
import Toast from './components/Toast';

import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';
const socket = io(URL);
const TIMEOUT_MS = 5000;

// --- Main App Component ---
const App = () => {
    const [view, setView] = useState('lobby'); // 'lobby' || 'waiting' || 'in-progress' ||'in-progress' ||'vote' || 'loading'
    const [theme, setTheme] = useState('dark');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [toasts, setToasts] = useState([]); // Array of { id, message, variant }

    const [voteEndDate, setVoteEndDate] = useState(null);
    const [gameEndDate, setGameEndDate] = useState(null);
    const [countdown, setCountdown] = useState("");
    const [isGameRunning, setIsGameRunning] = useState(false);
    const [isCodeCopied, setIsCodeCopied] = useState(false);
    const [modalRevealRole, setModalRevealRole] = useState(false);
    const [modalSpyGuess, setModalSpyGuess] = useState(false);

    const [roomChat, setRoomChat] = useState(["Welcome to the room!"]);
    const [locationsArr, setLocationsArr] = useState([]);
    const [playerList, setPlayerList] = useState([]);

    const [playerName, setPlayerName] = useState('');
    const [playerCode, setPlayerCode] = useState('');
    const [roomCode, setRoomCode] = useState('');

    const [role, setRole] = useState(''); // player's role
    const [location, setLocation] = useState(''); // player's location
    const playerNameRef = useRef(playerName);

    const showToast = (message, variant = 'info') => {
        const id = crypto.randomUUID();
        setToasts(prevToasts => [...prevToasts, { id, message, variant }]);
        setTimeout(() => {
            closeToast(id);
        }, 3000); // Toast disappears after 3 seconds
    };

    const closeToast = (id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    const sendChatMessage = (message) => {
        socket.timeout(TIMEOUT_MS).emit("chatMessage", { roomCode, playerCode, message }, (err, response) => {
            if (err) {  //server did not acknowledge in time
                console.error("Socket timeout sending chat message. Server did not respond in time.");
                setRoomChat(prev => [...prev, "*Socket timeout. Your message was not sent*"]);
                showToast("Socket timeout sending chat message. Your message was not sent.", "error");
            } else if (response.status !== 'success') { // server replied with error
                setRoomChat(prev => [...prev, "*Serve side error sending previous message*"]);
                showToast("Server side error sending previous message.", "error");
            } else {// else success and update roomchat
                setRoomChat(prev => [...prev, playerNameRef.current + ": " + message]);
            }
        });
    }

    const createRoom = () => {
        setView('loading');
        setLoadingMessage("Creating room...");
        socket.timeout(TIMEOUT_MS).emit("createRoom", (err, response) => {
            if (err) {  //server did not acknowledge in time
                console.error("Socket timeout creating room. Server did not respond in time.");
                showToast("Socket timeout error while creating room. Please try again later.", "error");
                setView('lobby');
            } else if (response.status !== 'success') {
                console.error("Error creating room.");
                showToast("Error creating room. Please try again.", "error");
                setView('lobby');
            } else { // else success
                //get room code from server, then emit joinRoom to server
                setRoomCode(response.roomCode);
                setRoomChat(prev => [...prev, "Created room " + response.roomCode]);
                showToast("Room " + response.roomCode + " created successfully!", "success");
                joinRoom(response.roomCode, playerNameRef.current);
            }
        });
    };

    const joinRoom = (roomCode, inputName) => {
        setView('loading');
        setLoadingMessage("Joining room...");
        socket.timeout(TIMEOUT_MS).emit("joinRoom", { roomCode, inputName }, (err, response) => {
            if (err) {  //server did not acknowledge in time
                console.error("Socket timeout joining room. Server did not respond in time.");
                showToast("Socket timeout error while joining room. Please try again later.", "error");
                setView('lobby');
            } else if (response.status !== 'success') {
                console.error("Error joining room. " + response.message);
                showToast("Error joining room: " + response.message, "error");
                setView('lobby');
            } else { // else success
                setRoomChat(prev => [...prev, "Joined room " + roomCode]);
                setRoomCode(response.roomCode);
                setPlayerName(response.playerName); //returned name could be different
                setPlayerCode(response.playerCode);
                setPlayerList(response.playerList);
                setView('waiting');
                showToast("Joined room " + roomCode + " successfully!", "success");
            }
        });
    };

    const leaveRoom = (roomCode, playerCode) => {
        socket.timeout(TIMEOUT_MS).emit("leaveRoom", { roomCode, playerCode }, (err, response) => {
            if (err) {
                console.error("Socket timeout leaving room. Server did not respond in time.");
                showToast("Socket timeout error while leaving room. Please try again later.", "error");
            } else if (response.status !== 'success') {
                console.error("Error leaving room. " + response.message);
                setRoomChat(prev => [...prev, "Error leaving room. " + response.message]);
                showToast("Error leaving room: " + response.message, "error");
            } else { // else success
                setView('lobby');
                setRoomChat(["Welcome to the room!"]);
                showToast("Left room successfully.", "info");
                console.log(response.message);
            }
        });
    }
    const endGame = (roomCode, playerCode) => {
        socket.timeout(TIMEOUT_MS).emit("endGame", { roomCode, playerCode }, (err, response) =>{
            if (err) {
                console.error("Socket timeout starting game. Server did not respond in time.");
                showToast("Error ending game: Server did not respond. Please try again later.", "error");
                setRoomChat(prev => [...prev, "Error: Could not end game. The server did not respond."]);
            } else if (response.status !== 'success') {
                console.error("Error ending game. " + response.message);
                setRoomChat(prev => [...prev, "Error ending game. " + response.message]);
                showToast("Error ending game: " + response.message, "error");
            } else { // else success
                setView('waiting');
                setRoomChat(prev => [...prev, "The host has ended the game."]);
                showToast("Game ended by host.", "info");
                setIsGameRunning(false);
            }
        });
    };

    const startGame = (roomCode, playerCode) => {
        setView('loading');
        setLoadingMessage("Starting game...");
        socket.timeout(TIMEOUT_MS).emit("startGame", { roomCode, playerCode }, (err, response) =>{
            if (err) {
                console.error("Socket timeout starting game. Server did not respond in time.");
                setRoomChat(prev => [...prev, "Error: Could not start game. The server did not respond."]);
                showToast("Error starting game: Server did not respond. Please try again later.", "error");
                setView('waiting');
            } else if (response.status !== 'success') {
                console.error("Error starting game. " + response.message);
                setRoomChat(prev => [...prev, "Error starting game. " + response.message]);
                showToast("Error starting game: " + response.message, "error");
                setView('waiting');
            } else { // else success
                //wait for gameStarted event from server to update view and other info
                setRoomChat(prev => [...prev, "Game is starting..."]);
                showToast("Game is starting!", "success");
            }
        });
    };

    const vote = (roomCode, playerCode, votedForID) => {
        socket.timeout(TIMEOUT_MS).emit("vote", { roomCode, playerCode, votedForID }, (err, response) => {
            if (err) {
                console.error("Socket timeout submitting vote. Server did not respond in time.");
                showToast("Error submitting vote: Server did not respond. Please try again later.", "error");
                setRoomChat(prev => [...prev, "Error: Could not submit vote. The server did not respond."]);
            } else if (response.status !== 'success') {
                console.error("Error submitting vote. " + response.message);
                setRoomChat(prev => [...prev, "Error submitting vote. " + response.message]);
                showToast("Error submitting vote: " + response.message, "error");
            } else { // else success
                //setRoomChat(prev => [...prev, "Your vote has been submitted."]);
                showToast("Your vote has been submitted.", "success");
            }
        });
    };

    const callVote = (roomCode, playerCode) => {
        socket.timeout(TIMEOUT_MS).emit("callVote", { roomCode, playerCode }, (err, response) => {
            if (err) {
                console.error("Socket timeout calling vote. Server did not respond in time.");
                setRoomChat(prev => [...prev, "Error: Could not call vote. The server did not respond."]);
                showToast("Error calling vote: Server did not respond. Please try again later.", "error");
            } else if (response.status !== 'success') {
                console.error("Error calling vote.");
                setRoomChat(prev => [...prev, response.message]);
                showToast("Error calling vote: " + response.message, "error");
            } else { // else success
                setView('vote');
                //setRoomChat(prev => [...prev, response.message]);
                //showToast("Vote initiated!", "info");
                //setVoteEndDate(new Date(response.endDate));
            }
        });
    };

    const spyGuessLocation = (roomCode, playerCode, guessedLocationID) => {
        socket.timeout(TIMEOUT_MS).emit("spyGuessLocation", { roomCode, playerCode, guessedLocationID }, (err, response) => {
            if (err) {
                console.error("Socket timeout submitting location guess. Server did not respond in time.");
                setRoomChat(prev => [...prev, "Error: Could not submit location guess. The server did not respond."]);
                showToast("Error submitting location guess: Server did not respond. Please try again later.", "error");
            } else if (response.status !== 'success') {
                console.error("Error submitting location guess. " + response.message);
                setRoomChat(prev => [...prev, "Error submitting location guess. " + response.message]);
                showToast("Error submitting location guess: " + response.message, "error");
            } else { // else success
                //let server send announcement of result
                showToast("Location guess submitted.", "success");
            }
        });
    };

    const getLocations = () => {
        socket.timeout(TIMEOUT_MS).emit('getLocations', (err, response) => {
            if (err) {
                console.error("Socket timeout fetching locations. Server did not respond in time.");
                showToast("Error fetching locations: Server did not respond. Please try again later.", "error");
            } else if (response.status !== 'success') {
                console.error("Error fetching locations.");
                showToast("Error fetching locations. Please try again.", "error");
            } else { // else success
                setLocationsArr(response.locations); //array of location objects { _id, name}
            }
        });
    };

    useEffect(() => {
        playerNameRef.current = playerName;
    }, [playerName]);

    //get locations on initial load
    useEffect(() => {
        getLocations();
    }, []);


    // game countdown timer effect
    useEffect(() => {
        if (!gameEndDate || !isGameRunning) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = gameEndDate.getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                setCountdown("00:00");
                setIsGameRunning(false); // Or handle game end
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(timer); // Cleanup on unmount or re-render
    }, [gameEndDate, isGameRunning]);


    //on first mount, setup socket event listeners
    useEffect(() => {
        socket.on('message', (data) => {
            switch (data.type) {
                case 'error':
                    console.log('An error occurred. ' + data.message);
                    showToast('An error occurred: ' + data.message, "error");
                    break;
                case 'announcement':
                    setRoomChat(prev => [...prev, data.message]);
                    //showToast(data.message, "info");
                    break;
                case 'gameStarted':
                    setView('loading');
                    setLoadingMessage("Assigning roles...");
                    setRoomChat(prev => [...prev, data.message]);
                    showToast("Game has started!", "success");
                    setGameEndDate(new Date(data.endDate));
                    setIsGameRunning(true);
                    break;
                case 'roleAssigned':
                    setRole(data.role);
                    setLocation(data.location);
                    setView('in-progress');
                    showToast("Your role has been assigned.", "info");
                    setModalRevealRole(true);
                    break;
                case 'voteEnded':
                    setView('in-progress');
                    if (data.endDate) {
                        setGameEndDate(new Date(data.endDate));
                    }
                    setRoomChat(prev => [...prev, data.message]);
                    showToast("The vote has ended.", "warning");
                    break;
                case 'voteCalled':
                    setView('vote');
                    setRoomChat(prev => [...prev, data.message]);
                    showToast("A vote has been called!", "warning");
                    setVoteEndDate(new Date(data.endDate));
                    break;
                case 'resetRoom':
                    setView('waiting');
                    setRoomChat(prev => [...prev, data.message]);
                    setRole('');
                    setLocation('');
                    showToast("Room has been reset.", "info");
                    setIsGameRunning(false);
                    break;
                case 'playerJoined':
                    setRoomChat(prev => [...prev, data.message]);
                    setPlayerList(prev => [...prev, { name: data.playerName, playerID: data.playerID, isHost: false }]);// any player that joins cannot be host
                    showToast(data.message, "info");
                    break;
                case 'playerLeftRoom':
                    setRoomChat(prev => [...prev, data.message]);
                    setPlayerList(prev => prev.filter(p => p.playerID !== data.playerLeftID));//update player list
                    //update host status if needed
                    if (data.newHostID) {
                        setPlayerList(prev => prev.map(p => p.playerID === data.newHostID ? { ...p, isHost: true } : p));
                    }
                    showToast(data.message, "info");
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
            { setTheme('dark'); localStorage.setItem('theme', 'dark'); }
        else if (theme === 'dark') 
            { setTheme('light'); localStorage.setItem('theme', 'light');}
    }

    const renderView = () => {
       
        switch(view) {
            case 'lobby':
                return (
                    <div className="grid grid-cols-1 gap-6 w-fit h-fit p-4 mt-4 mx-auto">
                        <PlayerContext.Provider value={{ playerName, setPlayerName, roomCode, setRoomCode }}>
                            <SetupCard onCreateRoom={createRoom} onJoinRoom={joinRoom} />
                        </PlayerContext.Provider>
                    </div>);
            case 'loading':
                return (
                    <div className="grid grid-cols-1 gap-6 w-fit h-fit p-4 mt-4 mx-auto">
                        <LoadingCard message={loadingMessage} />
                    </div>);
            case 'waiting': 
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6 p-8 mt-4 lg:mx-auto">
                        <PlayerContext.Provider value={{roomCode, playerName, playerCode}}>

                                {/* Left Column: action card */}
                            <div className="col-span-1 lg:col-start-1 xl:col-start-2 space-y-6  mt-6">
                                <button onClick={() => {leaveRoom(roomCode, playerCode); }} // wait for leftRoom handler to get response
                                    className="flex items-center gap-2 bg-[var(--warning)] dark:bg-[var(--warning-dark)] hover:bg-[var(--warning-dark)] dark:hover:bg-yellow-600 text-black 
                                    py-2 px-4 mx-auto rounded-lg font-medium transition duration-200 shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                    </svg>
                                    Leave Room
                                </button>
                                <div className="text-center">
                                    <p className="text-[var(--dark)] dark:text-[var(--secondary)]">Room Code</p>
                                    <div className="flex items-center justify-center gap-2">

                                        <h2 id='roomCodeText' className="text-5xl font-extrabold text-[var(--primary-dark)] dark:text-[var(--primary)] select-all">
                                            {roomCode}
                                        </h2>
                                        <button onClick={() => {
                                            navigator.clipboard.writeText(roomCode);
                                            setIsCodeCopied(true);
                                            setTimeout(() => setIsCodeCopied(false), 3000);
                                        }}
                                        className="bg-[var(--light)] dark:bg-[var(--secondary-dark)] hover:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-black dark:text-white 
                                        py-2 px-2 rounded-lg font-medium transition duration-200 shadow-md">
                                            {isCodeCopied ?
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" /></svg>
                                                :
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>
                                            }
                                        </button>
                                    </div>
                                    <span className="text-[var(--dark)] dark:text-[var(--secondary)] mt-2">Share this code with your friends!</span>
                                </div>
                                
                                <ActionsCard playerList={playerList} view={view} onStartGame={startGame}/>
                            </div>

                                {/* Middle Column: RoomChatHistory (middle) */}
                            <div className="col-span-1 lg:col-start-2 lg:col-span-2 xl:col-start-3 xl:col-span-2 space-y-6">
                                <RoomChatCard roomChat={roomChat} sendChatMessage={sendChatMessage}/>
                            </div>

                                {/* Second row */}
                            <div className="col-span-1 lg:row-start-2 lg:col-start-1 lg:col-span-3 xl:col-start-3 xl:col-span-2 space-y-6">
                                <LocationsCard locationsArr={locationsArr} serverURL={URL}/>
                            </div>
                        </PlayerContext.Provider>
                    </div>);
            case 'in-progress':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6 p-8 mt-4 lg:mx-auto">
                        <PlayerContext.Provider value={{roomCode, playerName, playerCode, role}}>
                            {modalRevealRole && createPortal( <RevealRoleCard location={location} role={role} onContinue={() => setModalRevealRole(false)} />
                                , document.body )}
                            {modalSpyGuess && createPortal( <SpyGuessCard locationsArr={locationsArr} onSpyGuessLocation={spyGuessLocation} onClose={() => setGuessLocationModal(false)} />
                                , document.body )}
                            
                                {/* Left Column: Player Card (Location/Role Display) and action card (middle)*/}
                            <div className="col-span-1 lg:col-start-1 xl:col-start-2 space-y-6 mt-6">
                                <button onClick={() => { leaveRoom(roomCode, playerCode);
                                    }} // wait for leftRoom handler to get response
                                    className="flex items-center gap-2 bg-[var(--warning)] dark:bg-[var(--warning-dark)] hover:bg-[var(--warning-dark)] dark:hover:bg-yellow-600 text-black 
                                    py-2 px-4 mx-auto rounded-lg font-medium transition duration-200 shadow-md">
                                    Leave Room
                                </button>
                                {isGameRunning && <div className="flex justify-center text-2xl font-bold ">Final Vote In {countdown}</div>}
                                <PlayerCard location={location} role={role} setModalSpyGuess={setModalSpyGuess}/>
                                <ActionsCard playerList={playerList} view={view} onCallVote={callVote} onEndGame={endGame}/>
                            </div>

                                {/* Middle Column: RoomChatHistory (middle) */}
                            <div className="col-span-1 lg:col-start-2 lg:col-span-2 xl:col-start-3 xl:col-span-2 space-y-6">
                                <RoomChatCard roomChat={roomChat} sendChatMessage={sendChatMessage}/>
                            </div>

                                {/* Second row */}
                            <div className="col-span-1 lg:row-start-2 lg:col-start-1 lg:col-span-3 xl:col-start-3 xl:col-span-2 space-y-6">
                                <LocationsCard locationsArr={locationsArr} serverURL={URL}/>
                            </div>
                        </PlayerContext.Provider>
                    </div>);
            case 'vote':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6 p-8 mt-4 lg:mx-auto">
                        <PlayerContext.Provider value={{roomCode, playerName, playerCode, role}}>
                            {modalSpyGuess && createPortal( <SpyGuessCard locationsArr={locationsArr} onSpyGuessLocation={spyGuessLocation} onClose={() => setGuessLocationModal(false)} />
                                , document.body )}
                            <div className="col-span-1 lg:col-start-1 xl:col-start-2 space-y-6 mt-6">
                                <PlayerCard location={location} role={role} setModalSpyGuess={setModalSpyGuess} />
                            </div>
                            <div className="col-span-1 lg:col-start-2 lg:col-span-2 xl:col-start-3 xl:col-span-2 space-y-6">
                                <RoomChatCard roomChat={roomChat} sendChatMessage={sendChatMessage}/>
                            </div>
                            <div className="col-span-1 lg:row-start-2 lg:col-start-1 lg:col-span-3 xl:col-start-3 xl:col-span-2 space-y-6">
                                <VoteCard playerList={playerList} onVote={vote} voteEndDate={voteEndDate} />
                            </div>
                        </PlayerContext.Provider>
                    </div>);
            default:
                return (<div>
                    <h1>Unknown View</h1>                    
                </div>);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--light)] dark:bg-[var(--dark)] text-black dark:text-white font-sans flex flex-col items-center justify-center pt-4 px-4 transition duration-500">
            <div className='fixed top-0 flex w-full bg-[var(--primary)] dark:bg-[var(--primary-dark)] shadow-xl p-4 items-center justify-between'>
                <h1 className='text-xl text-black dark:text-white'>Spyfall</h1>
                <button className="rounded-l border-1 border-black p-2" onClick={() => { setView("lobby") }}
                    > lobby view
                </button>
                <button className="rounded-l border-1 border-black p-2" onClick={() => { setModalRevealRole(true); 
                    setRole("Ice cream vendor"); setLocation("Space station over antarctica");
                  }}>
                    reveal role modal
                </button>
                <button className="rounded-l border-1 border-black p-2" onClick={() => { setView("loading"); setLoadingMessage("test message..."); }}>
                    loading view
                </button>
                <button className="rounded-l border-1 border-black p-2" onClick={() => showToast('This is an info toast!', 'info')}>
                    Info Toast
                </button>
                <button className="rounded-l border-1 border-black p-2" onClick={() => showToast('Success! Operation completed.', 'success')}>
                    Success Toast
                </button>
                <button className="rounded-l border-1 border-black p-2" onClick={() => showToast('Warning: Something might be wrong.', 'warning')}>
                    Warning Toast
                </button>
                <button className="rounded-l border-1 border-black p-2" onClick={() => showToast('Error: Something went wrong!', 'error')}>
                    Error Toast
                </button>
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
            <div className="fixed bottom-20 right-8 z-50">
                {toasts.map((toast, index) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        variant={toast.variant}
                        onClose={() => closeToast(toast.id)}
                        style={{ bottom: `${(index+1) * 5}rem` }}
                    />
                ))}
            </div>
        </div>
    );
};

export default App;
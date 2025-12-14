import React, { useState, useContext, useEffect } from 'react';
import Card from './Card';
import PlayerContext from '../contexts/PlayerContext';

// Lobby view for joining or creating a game
const SetupCard = ({ onCreateRoom, onJoinRoom, invalidRoomCode, setInvalidRoomCode }) => {
    
    // has properties from closest parent context: playerName, setPlayerName, roomCode, setRoomCode
    const playerContextObj = useContext(PlayerContext); 

    //if roomCode exists in context, populate the input boxes
    useEffect(() => {
        if (playerContextObj.roomCode && playerContextObj.roomCode.length === 4) {
            for (let i = 0; i < 4; i++) {
                document.getElementById(`code${i+1}`).value = playerContextObj.roomCode[i];
            }
        }
    }, []); //run only on initial render

    //mark code input boxes invalid if invalidRoomCode prop is true
    useEffect(() => {
        const codebox = document.getElementById('codebox');
        if (invalidRoomCode) {
            codebox.classList.add('border-3', 'border-red-500', 'dark:border-pink-500', 'bg-red-200', 'dark:bg-pink-900/30');
        } else {
            codebox.classList.remove('border-3', 'border-red-500', 'dark:border-pink-500', 'bg-red-200', 'dark:bg-pink-900/30');
        }
    }, [invalidRoomCode]);

    const onPasteCode = (e) => {
        //check if pasted data exists
        if (!e.clipboardData.getData('text')) return;
        let pasteData = e.clipboardData.getData('text').trim();
        //limit to 4 characters (could have < 4 characters), convert to uppercase, then convert to array
        pasteData = pasteData.slice(0,4).toUpperCase().split('');

        let regex = /^[a-zA-Z0-9]?$/; //alphanumeric only
        //loop through pasteData to validate each character, skip invalid characters
        pasteData = pasteData.filter(char => { return char.match(regex); });
        
        let code = '';
        // all or nothing paste logic, any unfilled inputs are considered empty
        // clear all input boxes first
        setInvalidRoomCode(false); //clear invalid room code state on new paste
        for (let i = 0; i < 4; i++) {
            let inputBox = document.getElementById(`code${i+1}`);
            if (inputBox) {
                inputBox.value = '';
            }
        }
        //replace 4 inputs with chars of pasted data
        for (let i = 0; i < pasteData.length; i++) { 
            let inputBox = document.getElementById(`code${i+1}`);
            if (inputBox) {
                inputBox.value = pasteData[i];
                code += pasteData[i];
            }
        }
        //focus on next input box after pasted data
        if (pasteData.length < 4) {
            document.getElementById(`code${pasteData.length + 1}`).focus();
        } else {
            document.getElementById('code4').focus();
        }
        playerContextObj.setRoomCode(code);
    };

    //logic for handling every key up input for room code
    const onKeyUpCode = (e) => {

        const value = e.target.value.toUpperCase(); //convert to uppercase
        e.target.value = value; //set the input box value to uppercase
        //validate input to be alphanumeric only
        let regex = /^[A-Z0-9]?$/; // single or no character alphanumeric matched at beginning and end
        if (!value.match(regex)) {
            e.target.value = ''; //clear invalid input
            return;
        }
        const nextInput = e.target.getAttribute('nextinput');
        const prevInput = e.target.getAttribute('previnput');

        //handle if event is backspace or normal input
        if (e.key === 'Backspace' && !value && prevInput) {
            let p = document.getElementById(prevInput);
            p.focus();
            p.value = '';
        } else if (value && nextInput) {
            document.getElementById(nextInput).focus();
        }
        setInvalidRoomCode(false); //clear invalid room code state on new input
        // Update room code in context
        let code = '';
        for (let i = 1; i <= 4; i++) {
            let inputVal = document.getElementById(`code${i}`).value;
            code += inputVal ? inputVal : '';
        }
        playerContextObj.setRoomCode(code);
    };


    return (
        <Card title="" className="p-6 mt-6 h-full flex flex-col space-y-4 transition duration-500">
            <div className="space-y-4 pt-4 pb-8 border-b border-gray-900 dark:border-gray-700">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-black dark:text-gray-300">Welcome!</h2>
                    <p className="text-black dark:text-gray-300 mt-2">Enter your name to begin.</p>
                </div>
                <div className="flex-col justify-center gap-4">
                    <input type="text" placeholder="Your Name" id='name' required
                        value={playerContextObj.playerName} maxLength={20}
                        onChange={(e) => playerContextObj.setPlayerName(e.target.value)}
                        className="p-3 bg-gray-200 dark:bg-gray-700 border border-gray-600 inset-shadow-sm/10
                            rounded-lg text-black dark:text-white w-full focus:outline focus:outline-cyan-400 
                            invalid:focus:outline-red-500 dark:focus:outline-cyan-400 dark:invalid:focus:outline-pink-500"
                    />
                    
                </div>
            </div>

                
            <div className="space-y-4 pt-4">
                <div className="text-center mb-4">
                    <p className="text-black dark:text-gray-300 mt-2">Join with Code</p>
                </div>
                <div id='codebox' className="flex justify-center gap-2 rounded-xl p-2">

                    <input type="text" maxLength="1" pattern="^[a-zA-Z0-9]?$" id='code1' nextinput='code2' onPaste={onPasteCode} onKeyUp={onKeyUpCode}
                        className="h-16 w-16 p-2 bg-gray-200 dark:bg-gray-700 border border-gray-700 inset-shadow-sm/10 
                            rounded-lg text-3xl text-gray-700 dark:text-white text-center focus:outline focus:outline-cyan-400"/>

                    <input type="text" maxLength="1" pattern="^[a-zA-Z0-9]?$" id='code2' nextinput='code3' previnput='code1' onPaste={onPasteCode} onKeyUp={onKeyUpCode}
                        className="h-16 w-16 p-2 bg-gray-200 dark:bg-gray-700 border border-gray-700 inset-shadow-sm/10 
                            rounded-lg text-3xl text-gray-700 dark:text-white text-center focus:outline focus:outline-cyan-400"/>

                    <input type="text" maxLength="1" pattern="^[a-zA-Z0-9]?$" id='code3' nextinput='code4' previnput='code2' onPaste={onPasteCode} onKeyUp={onKeyUpCode}
                        className="h-16 w-16 p-2 bg-gray-200 dark:bg-gray-700 border border-gray-700 inset-shadow-sm/10 
                            rounded-lg text-3xl text-gray-700 dark:text-white text-center focus:outline focus:outline-cyan-400"/>

                    <input type="text" maxLength="1" pattern="^[a-zA-Z0-9]?$" id='code4' previnput='code3' onPaste={onPasteCode} onKeyUp={onKeyUpCode}
                        className="h-16 w-16 p-2 bg-gray-200 dark:bg-gray-700 border border-gray-700 inset-shadow-sm/10  
                            rounded-lg text-3xl text-gray-700 dark:text-white text-center focus:outline focus:outline-cyan-400"/>

                </div>
                    <div className="text-center">
                        {invalidRoomCode && <p className="text-lg font-semibold text-red-500 dark:text-pink-500">Room not found</p>}
                    </div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => onCreateRoom(playerContextObj.playerName)} // anonymous function to pass name value
                    className={`flex items-center justify-center gap-2 space-x-2 py-2 px-4 rounded-3xl transition duration-200 shadow-md 
                        ${!playerContextObj.playerName 
                            ? 'bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600 cursor-not-allowed hover:scale-95' 
                            : 'bg-blue-500 hover:bg-blue-600 hover:cursor-pointer hover:scale-105'}`}
                    disabled={!playerContextObj.playerName}>
                    Create Room
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </button>
                <button onClick={() => { onJoinRoom(playerContextObj.roomCode, playerContextObj.playerName); }} // anonymous function to pass name and code values
                    className={`flex items-center justify-center gap-2 space-x-2 py-2 px-4 rounded-3xl font-medium transition duration-200 shadow-md 
                        ${(playerContextObj.roomCode.length !== 4) || (!playerContextObj.playerName) 
                            ? 'bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600 cursor-not-allowed hover:scale-95' 
                            : 'bg-blue-500 hover:bg-blue-600 hover:cursor-pointer hover:scale-105'}`}
                    disabled={playerContextObj.roomCode.length !== 4 || !playerContextObj.playerName} >
                    Join Room
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
                    </svg>
                </button>
            </div>

        </Card>
    )
};

export default SetupCard;

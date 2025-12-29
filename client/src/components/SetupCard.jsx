import React, { useState, useContext, useEffect } from 'react';
import Card from './Card';
import Button from './Button'
import PlayerContext from '../contexts/PlayerContext';

// Lobby view for joining or creating a game
const SetupCard = ({ onCreateRoom, onJoinRoom }) => {
    
    // has properties from closest parent context: playerName, setPlayerName, roomCode, setRoomCode
    const playerContextObj = useContext(PlayerContext);

    const codeStyle = `h-16 w-16 p-2 bg-[var(--light)] dark:bg-[var(--secondary-dark)] border-2 border-[var(--secondary)] inset-shadow-sm/10 rounded-lg text-3xl text-[var(--dark)] dark:text-[var(--light)] text-center focus:outline-2 focus:outline-[var(--primary)]`
    const btnStyle = `bg-[var(--primary)] dark:bg-cyan-500 text-[var(--dark)] dark:text-[var(--light)] hover:bg-cyan-500 dark:hover:bg-cyan-600 hover:cursor-pointer hover:scale-105
                disabled:bg-[var(--light)] disabled:dark:bg-[var(--secondary-dark)] disabled:border disabled:border-[var(--secondary)] disabled:cursor-not-allowed disabled:hover:scale-95`
    //if roomCode exists in context, populate the input boxes
    useEffect(() => {
        if (playerContextObj.roomCode && playerContextObj.roomCode.length === 4) {
            for (let i = 0; i < 4; i++) {
                document.getElementById(`code${i+1}`).value = playerContextObj.roomCode[i];
            }
        }
    }, []); //run only on initial render

    

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
            <div className="space-y-4 pt-4 pb-8 border-b border-[var(--dark)] dark:border-[var(--dark)]">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-[var(--dark)] dark:text-[var(--light)]">Welcome!</h2>
                    <p className="text-[var(--secondary-dark)] dark:text-[var(--secondary)] mt-2">Enter your name to begin.</p>
                </div>
                <div className="flex-col justify-center gap-4">
                    <input type="text" placeholder="Your Name" id='name' required
                        value={playerContextObj.playerName} maxLength={20}
                        onChange={(e) => playerContextObj.setPlayerName(e.target.value)}
                        className="p-3 bg-[var(--light)] dark:bg-[var(--secondary-dark)] border-2 border-[var(--secondary)]
                            inset-shadow-sm/10 rounded-lg text-[var(--dark)] dark:text-[var(--light)] w-full focus:outline-2 focus:outline-[var(--primary)]
                            invalid:focus:outline-[var(--danger)]"
                    />
                    
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <div className="text-center mb-4">
                    <p className="text-[var(--dark)] dark:text-[var(--light)] mt-2">Join with Code</p>
                </div>
                <div id='codebox' className="flex justify-center gap-2 rounded-xl p-2">
                    <input type="text" maxLength="1" pattern="^[a-zA-Z0-9]?$" id='code1' nextinput='code2' onPaste={onPasteCode} onKeyUp={onKeyUpCode}
                        className={codeStyle}/>
                    <input type="text" maxLength="1" pattern="^[a-zA-Z0-9]?$" id='code2' nextinput='code3' previnput='code1' onPaste={onPasteCode} onKeyUp={onKeyUpCode}
                        className={codeStyle}/>
                    <input type="text" maxLength="1" pattern="^[a-zA-Z0-9]?$" id='code3' nextinput='code4' previnput='code2' onPaste={onPasteCode} onKeyUp={onKeyUpCode}
                        className={codeStyle}/>
                    <input type="text" maxLength="1" pattern="^[a-zA-Z0-9]?$" id='code4' previnput='code3' onPaste={onPasteCode} onKeyUp={onKeyUpCode}
                        className={codeStyle}/>
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => onCreateRoom(playerContextObj.playerName)} // anonymous function to pass name value
                    className={`flex items-center justify-center gap-2 space-x-2 py-2 px-4 rounded-3xl transition duration-200 shadow-md 
                        ${btnStyle}`}
                        disabled={!playerContextObj.playerName}>
                    Create Room
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </button>
                <button onClick={() => { onJoinRoom(playerContextObj.roomCode, playerContextObj.playerName); }} // anonymous function to pass name and code values
                    className={`flex items-center justify-center gap-2 space-x-2 py-2 px-4 rounded-3xl transition duration-200 shadow-md 
                        ${btnStyle}`}
                        disabled={playerContextObj.roomCode.length !== 4 || !playerContextObj.playerName}>
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

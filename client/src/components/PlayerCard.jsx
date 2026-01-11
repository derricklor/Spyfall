import { useState } from 'react';
import { createPortal } from 'react-dom';
import Card from './Card';

const PlayerCard = ({ location, role, setModalSpyGuess }) => {
    const [isRoleRevealed, setIsRoleRevealed] = useState(false);
    const isSpy = role === 'Spy';

    return (
        <Card className="p-6 h-fit flex flex-col space-y-4 transition duration-500 items-center justify-center text-center">
            <span className="text-[var(--dark)]/50 dark:text-[var(--light)]/50">Hover or Click to Reveal</span>
            <div className="grid grid-cols-1 relative cursor-pointer z-1"
                onMouseEnter={() => setIsRoleRevealed(true)}
                onMouseLeave={() => {setIsRoleRevealed(false)}}
                onClick={() => setIsRoleRevealed(!isRoleRevealed)}
            >
                
                <div className={`transition-all duration-500 ${isRoleRevealed ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--secondary)] dark:bg-[var(--secondary-dark)] rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                    </div>
                </div>

                <div className={`transition-all duration-500 ${isRoleRevealed ? 'opacity-100' : 'opacity-0'}`}>
                    {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg> */}
                    <div className="grid grid-cols-2 items-center justify-center">

                        <span className="col-span-1 text-xl font-light text-[var(--dark)] dark:text-[var(--light)]">Your role is: </span>
                        <span className={`col-span-1 text-xl font-bold ml-2 ${isSpy ? 'text-[var(--danger)]' : 'text-[var(--primary-dark)] dark:text-[var(--primary)]'}`}>
                            {role}
                        </span>
                        <span className="col-span-1 text-xl font-light text-[var(--dark)] dark:text-[var(--light)]">The location is: </span>
                        <span className="col-span-1 text-xl font-bold ml-2 text-[var(--dark)] dark:text-[var(--light)]">
                            {isSpy ? "???" : location}
                        </span>
                        {isSpy && 
                            <button className={`flex items-center gap-2 bg-[var(--warning)] hover:brightness-80 hover:cursor-pointer hover:scale-105 text-black 
                                py-2 px-4 mx-auto rounded-lg font-medium transition duration-500 shadow-md mt-4 z-2 col-span-2 ${isRoleRevealed ? '' : 'hidden'}`}
                                onClick={()=> setModalSpyGuess(true)}>
                                Guess the Location
                            </button>}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PlayerCard;
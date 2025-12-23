import Card from './Card';
import { useContext } from 'react';

import PlayerContext from '../contexts/PlayerContext';

// In-game control panel (players and actions)
const ActionsCard = ({ playerList, view, onStartGame, OnCallVote }) => {
    //change available actions based on view state

    const playerContextObj = useContext(PlayerContext);
    //check if current player is host
    const hostPlayerObj = playerList.find(p => p.isHost === true); // if no host, returns null

    const isHost = (playerContextObj.playerName === hostPlayerObj.name); // if null, then no name property
    return (
        <div className="space-y-6">
            <Card title="Players" className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

                    {playerList.map((player) => (
                        <div key={player.playerID} className=" text-[var(--secondary-dark)] dark:text-[var(--light)]">
                            <span className={`flex items-center gap-2 font-semibold truncate ${playerContextObj.playerName === player.name ? 'text-[var(--primary)]' : 'text-[var(--dark)]dark:text-[var(--light)]'}`}>
                                {player.isHost && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                                </svg>}
                                {player.name}
                            </span>
                        </div>
                    ))}
                </div>
                {isHost && (view === 'waiting') ? ( // render if host and viewing waiting room
                    <div className="flex flex-col items-center space-y-4">
                        <span className="text-sm text-[var(--secondary-dark)] dark:text-[var(--secondary)]">You are the host. You can start the game when there are at least 3 players.</span>
                        <button className={`text-[var(--dark)] dark:text-[var(--light)] bg-[var(--light)] dark:bg-[var(--secondary-dark)] rounded-lg p-2 transition duration-200 shadow-md
                            ${playerList.length < 3 
                            ? 'bg-[var(--light)] dark:bg-[var(--secondary-dark)] border border-[var(--secondary)] cursor-not-allowed hover:scale-95' 
                            : 'bg-[var(--primary)] hover:brightness-80 hover:cursor-pointer hover:scale-105'}`} onClick={onStartGame} disabled={playerList.length < 3}>
                            Start Game
                        </button>
                    </div>
                ) : ''}
                {!isHost && (view === 'waiting') ? (
                    <p className="text-center text-[var(--secondary-dark)] dark:text-[var(--secondary)]">Waiting for the host to start the game...</p>
                ) : ''}

                {isHost && (view ==='in-progress') ? ( // render end game button if host and room is in-progress
                    <div>
                        <button className="flex justify-center items-center rounded-3xl shadow-md text-[var(--dark)] dark:text-[var(--light)] ">
                            onClick={endGame}
                            End Game
                        </button>
                    </div>
                ) : '' }

            </Card>

        </div>
    );
};

export default ActionsCard;
import Card from './Card';
import { useContext } from 'react';

import PlayerContext from '../contexts/PlayerContext';

// In-game control panel (players and actions)
const ActionsCard = ({ playerList, onStartGame }) => {

    const playerContextObj = useContext(PlayerContext);
    //check if current player is host
    const hostPlayerObj = playerList.find(p => p.isHost === true);    
    const isHost = (playerContextObj.playerName === hostPlayerObj.name);
    return (
        <div className="space-y-6">
            <Card title="Players" className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

                    {playerList.map((player, index) => (
                        <li key={index} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                                {player.isHost && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                </svg>}
                                {player.name}
                            </span>
                        </li>
                    ))}
                </div>
                {isHost && (
                    <button onClick={onStartGame} disabled={playerList.length < 3}>
                        {playerList.length < 3 ? `Need at least 3 players` : `Start Game`}
                    </button>
                )}
                {!isHost && (
                    <p className="text-center text-gray-600 dark:text-gray-400">Waiting for the host to start the game...</p>
                )}

            </Card>

        </div>
    );
};

export default ActionsCard;
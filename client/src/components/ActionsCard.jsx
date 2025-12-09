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
                        <div key={index} className=" text-gray-700 dark:text-gray-300">
                            <span className={`flex items-center gap-2 font-semibold truncate ${playerContextObj.playerName === player.name ? 'text-cyan-400 dark:text-cyan-400' : 'text-gray-900 dark:text-white'}`}>
                                {player.isHost && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                                </svg>}
                                {player.name}
                            </span>
                        </div>
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
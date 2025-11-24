import Card from './Card';
import { useContext } from 'react';

import PlayerContext from '../contexts/PlayerContext';

// In-game control panel (players and actions)
const ActionsCard = ({ timeLeft, playerList, onStartGame }) => {

    const playerContextObj = useContext(PlayerContext);
    //check if current player is host
    const hostPlayer = playerList.filter(p => p.isHost === 'true');
    const isHost = playerContextObj.playerName === hostPlayer.name;

    return (
        <div className="space-y-6">
            <Card title="Players" className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

                    {playerList.map((player, index) => (
                        <li key={index} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-900 dark:text-white truncate">{player.name}</span>
                            {player.isHost && <span className="text-xs text-cyan-600 dark:text-cyan-400 block">Host</span>}
                            <span className="text-sm">{player.isHost ? 'Host ' + player.name : player.name}</span>
                        </li>
                    ))}
                </div>
                {isHost && (
                    <Button onClick={onStartGame} disabled={players.length < 3}>
                        {players.length < 3 ? `Need at least 3 players` : `Start Game`}
                    </Button>
                )}
                {!isHost && (
                    <p className="text-center text-gray-600 dark:text-gray-400">Waiting for the host to start the game...</p>
                )}

            </Card>

        </div>
    );
};

export default ActionsCard;
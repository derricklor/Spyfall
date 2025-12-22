import Card from './Card';
import { useState, useContext } from 'react';
import PlayerContext from '../contexts/PlayerContext';

const VoteCard = ({playerList, onVote}) => {
    const playerContextObject = useContext(PlayerContext);

    const [voteFor, setVotedFor] = useState('');
    //filter out current player from list, as you cannot vote for yourself
    const [newPlayerList, setNewPlayerList] = useState(playerList);

    newPlayerList.filter(player => player.name !== playerContextObject.playerName);
    return (
        <Card title="Vote for a Spy" className="p-4">
            <div className="space-y-4">
                {playerList.map((player, index) => (
                    <button
                        key={player.id}
                        disabled={playerContextObject.playerName === player.name}
                        onClick={() => {
                            setVotedFor(player.name)
                            onVote(playerContextObject.roomCode, playerContextObject.playerCode, player.name)
                        }} //(roomCode, playerCode, votedFor)
                        className={`w-full py-3 rounded-lg text-lg font-medium text-[var(--dark)] dark:text-[var(--light)] disabled:cursor-not-allowed 
                            disabled:bg-[var(--secondary)] dark:disabled:bg-[var(--secondary-dark)] dark:disabled:border dark:disabled:border-[var(--secondary)]
                            transition duration-200
                            ${voteFor === player.name ? 'ring-4 ring-[var(--primary)] scale-105' : ''}
                            bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 `}
                    >
                        <span className="text-xl">{player.name}</span>

                    </button>
                ))}
            </div>
        </Card>
    );
};

export default VoteCard;
import Card from './Card';
import { useContext } from 'react';
import PlayerContext from '../contexts/PlayerContext';

const VoteCard = ({playerList, onVote}) => {
    const playerContextObject = useContext(PlayerContext);

    return (
        <Card title="Vote for a Spy" className="p-4">
            <div className="space-y-4">
                {playerList.map((player, index) => (
                    <button
                        key={index}
                        onClick={() => onVote(playerContextObject.roomCode, playerContextObject.playerCode, player.name)} //(roomCode, playerCode, votedFor)
                        className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-black dark:text-white text-lg font-medium transition duration-150"
                    >
                        <span className="text-xl">{ player.isHost ? 'Host '+ player.name : player.name}</span>

                    </button>
                ))}
            </div>
        </Card>
    );
};

export default VoteCard;
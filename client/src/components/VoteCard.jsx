import Card from './Card';
import { useState, useContext } from 'react';
import PlayerContext from '../contexts/PlayerContext';

const VoteCard = ({playerList, onVote}) => {
    const playerContextObject = useContext(PlayerContext);

    const [voteForID, setVotedForID] = useState(""); // holds id of player to vote as spy

    return (
        <Card title="Vote for a Spy" className="p-6 mt-6 h-full flex flex-col space-y-4 transition duration-500">
            <div className="space-y-4 pt-4 pb-8 border-b border-[var(--dark)] dark:border-[var(--dark)]">
                {playerList.map((player) => (
                    <button
                        key={player.playerID}
                        disabled={playerContextObject.playerCode === player.playerID} // disable voting for self
                        onClick={() => setVotedForID(player.playerID)}
                        className={`w-full py-3 rounded-lg text-lg font-medium text-[var(--dark)] dark:text-[var(--light)] disabled:cursor-not-allowed 
                            disabled:bg-[var(--secondary)] dark:disabled:bg-[var(--secondary)] dark:disabled:border dark:disabled:border-[var(--secondary)]
                            transition duration-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 
                            ${voteForID === player.playerID ? 'ring-4 ring-[var(--primary)]' : ''} `}
                    >
                        <span className="text-xl">{player.name}</span>

                    </button>
                ))}
            </div>
            <div className="">
                <button className="flex items-center justify-center gap-2 space-x-2 py-2 px-4 rounded-3xl transition duration-200 shadow-md bg-[var(--primary)] dark:bg-cyan-500 text-[var(--dark)] dark:text-[var(--light)] hover:bg-cyan-500 dark:hover:bg-cyan-600 hover:cursor-pointer hover:scale-105
                disabled:bg-[var(--light)] disabled:dark:bg-[var(--secondary-dark)] disabled:border disabled:border-[var(--secondary)] disabled:cursor-not-allowed disabled:hover:scale-95"
                onClick={()=> onVote(playerContextObject.roomCode, playerContextObject.playerCode, voteForID)}
                    disabled={voteForID === ""}
                    >
                    submit vote
                </button>
            </div>
        </Card>
    );
};

export default VoteCard;
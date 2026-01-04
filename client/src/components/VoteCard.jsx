import Card from './Card';
import { useState, useContext, useEffect } from 'react';
import PlayerContext from '../contexts/PlayerContext';

const VoteCard = ({ playerList, onVote, voteEndDate }) => {
    const playerContextObject = useContext(PlayerContext);

    const [voteForID, setVotedForID] = useState(null); // holds id of player to vote as spy
    const [countdown, setCountdown] = useState("");

    useEffect(() => {
        if (!voteEndDate) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = voteEndDate.getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                setCountdown("00:00");
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(timer); // Cleanup on unmount or re-render
    }, [voteEndDate]);


    return (
        <Card title="Vote for a Spy" className="p-6 mt-6 h-full flex flex-col space-y-4 transition duration-500">
            <div className="text-2xl font-bold text-center">{countdown}</div>
            <div className="space-y-4 pt-4 pb-8 border-b border-[var(--dark)] dark:border-[var(--dark)]">
                {playerList.map((player) => (
                    <button
                        key={player.playerID}
                        disabled={playerContextObject.playerCode === player.playerID} // disable voting for self
                        onClick={() => setVotedForID(player.playerID)}
                        className={`w-full py-3 rounded-lg text-lg font-medium text-[var(--dark)] dark:text-[var(--light)] 
                            transition duration-200 bg-[var(--primary)] hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-600 hover:cursor-pointer
                            disabled:bg-[var(--light)] disabled:dark:bg-[var(--secondary-dark)] disabled:border disabled:border-[var(--secondary)] disabled:cursor-not-allowed
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
                    disabled={voteForID === null}
                    >
                    Submit Vote
                </button>
            </div>
        </Card>
    );
};

export default VoteCard;

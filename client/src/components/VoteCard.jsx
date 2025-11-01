import Card from './Card';
const VoteCard = ({playerList, onVote}) => {
    return (
        <Card title="Vote for a Spy" className="p-4">
            <div className="space-y-4">
                {playerList.map((player, index) => (
                    <button
                        key={index}
                        onClick={() => onVote(player.name)}
                        className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-lg font-medium transition duration-150"
                    >
                        <span className="text-xl">{ player.isHost ? 'Host '+ player.name : player.name}</span>

                    </button>
                ))}
            </div>
        </Card>
    );
};

export default VoteCard;
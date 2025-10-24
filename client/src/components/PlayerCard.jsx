import Card from './Card';
// Displays the player's location and role
const PlayerCard = ({ isSpy, location, role }) => {
    return (
        <Card className="flex flex-col items-center justify-center text-center p-6 border-2 border-indigo-500">
            <p className="text-xl font-light text-gray-400">The location is:</p>
            <div className={`text-4xl font-bold mt-1 mb-4 ${isSpy ? 'text-yellow-400' : 'text-green-400'}`}>
                {location}
            </div>

            <p className="text-xl font-light text-gray-400">Your role is:</p>
            <div className={`text-4xl font-bold mt-1 ${isSpy ? 'text-red-400' : 'text-blue-400'}`}>
                {role}
            </div>
        </Card>
    );
};
export default PlayerCard;
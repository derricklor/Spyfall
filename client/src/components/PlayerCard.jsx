import Card from './Card';
// Displays the player's location and role
const PlayerCard = ({ location, role }) => {
    return (
        <Card className="flex flex-col items-center justify-center text-center p-6 border-2 border-indigo-500 bg-gray-200 dark:bg-gray-900">
            <p className="text-xl font-light text-black dark:text-white">The location is:</p>
            <div className={`text-4xl font-bold mt-1 mb-4 hidden hover:block ${role === 'Spy' ? 'text-gray-900 dark:text-gray-100 hover:text-yellow-400 dark:hover:text-yellow-400' 
                : 'text-gray-900 dark:text-gray-100 hover:text-green-400 dark:hover:text-green-400'}`}>
                {location}
            </div>

            <p className="text-xl font-light text-black dark:text-white">Your role is:</p>
            <div className={`text-4xl font-bold mt-1 hidden hover:block ${role === 'Spy' ? 'text-gray-900 dark:text-gray-100 hover:text-red-400 dark:hover:text-red-400' 
                : 'text-gray-900 dark:text-gray-100 hover:text-blue-400 dark:hover:text-blue-400'}`}>
                {role}
            </div>
        </Card>
    );
};
export default PlayerCard;
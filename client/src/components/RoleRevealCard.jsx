
import Card from './Card';
// Displays the player's role during the reveal phase
const RoleRevealCard = ({ location, role }) => {
    const isSpy = (role === 'Spy');
return (
    <Card title="" className="p-6 h-full flex flex-col space-y-8">
        <div className="space-y-4 pt-4 pb-8 border-b border-gray-900 dark:border-gray-700">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-black dark:text-gray-300">The location is: {location}</h2>
                (isSpy) ?
                <p className="text-black dark:text-gray-300 mt-2">
                    {isSpy ?
                    "You are the Spy! Your goal is to blend in and try to guess the location by listening to the other players' discussions."
                    :
                    "Do not give away the location! Ask your fellow players questions to clear them of suspicion and vote off the Spy."}
                </p>
            </div>

            <div className="text-center">

                <h2 className="text-3xl font-bold text-black dark:text-gray-300">Your role: {role}</h2>
                <p className="text-black dark:text-gray-300 mt-2">
                    {isSpy ? 
                    "As the Spy, your goal is to blend in and avoid detection while trying to deduce the location." 
                    : 
                    "As a non-Spy, your goal is to identify and vote off the Spy while protecting the location information."}
                </p>
            </div>
        </div>
    </Card>
    )
}

export default RoleRevealCard;
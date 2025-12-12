import Card from './Card';

const RevealRoleCard = ({ role, location }) => {

    const testrole = role || "Spy";
    const testlocation = location || "Beach";

    return (
        <Card title="" className="p-6 h-full flex flex-col space-y-4 transition duration-500">
            
            <div className="space-y-4 pt-4 pb-8 border-b border-gray-900 dark:border-gray-700">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-black dark:text-gray-300">The game is about to begin!</h2>
                    <p className="text-black dark:text-gray-300 mt-2">your role is: {testrole}</p>
                </div>
                <div className="flex-col justify-center gap-4">
                    the location is: {testlocation}
                    
                </div>
            </div>
        </Card>
    );
};

export default RevealRoleCard;
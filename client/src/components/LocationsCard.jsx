import Card from './Card';

// The 3x3 grid of location cards
const LocationsCard = ({locationsArr, serverURL}) => { //destructure locationsArr from props object
    // Mock data for locations
    // const locations = Array(9).fill(0).map((_, i) => ({ id: i, name: `Loc ${i + 1}` }));
    // use socket to get real data
    
    return (
        <Card title="Locations" className="h-fit">
            <div className="grid grid-cols-3 gap-3">
                {locationsArr?.map((element) => (
                    <div
                        key={element._id} className="aspect-square transition duration-150 rounded-lg flex items-center justify-center p-2 text-sm text-gray-800 dark:text-gray-400 cursor-pointer border border-gray-400 dark:border-gray-600"
                        style={{ minHeight: '80px' }}>
                        {element.name}
                        <img src={`${serverURL}/imgs/${element.name}.png`} alt={element.name} />
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default LocationsCard;

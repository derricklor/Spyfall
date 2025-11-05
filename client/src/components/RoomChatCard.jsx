import Card from './Card';

const RoomChatCard = ({roomChat}) => {
    return (
        <Card title="Room Chat" className="p-4 h-full flex flex-col">
            <div className="flex-grow overflow-y-auto mb-4">
                {roomChat.map((msg, index) => (
                    <div key={index} className="mb-2">
                        <span className="font-semibold text-white">{msg}</span>
                    </div>
                ))}
            </div>

        </Card>
        );
}

export default RoomChatCard;

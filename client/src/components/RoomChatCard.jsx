import Card from './Card';
import { React, useContext } from 'react';

const RoomChatCard = ({roomChat, sendChatMessage}) => {

    // function to handle sending chat message on enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            sendChatMessage(e.target.value.trim());
            e.target.value = ''; // clear input field
        }
    };

    return (
        <Card title="Room Chat" className="p-4 h-fit flex flex-col">
            <div className="flex-grow overflow-y-auto mb-4">
                {roomChat.map((msg, index) => (
                    <div key={index} className="mb-2">
                        <span className="font-semibold text-black dark:text-white">{msg}</span>
                    </div>
                ))}
                <input type="text" className="font-semibold bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-gray-300 dark:border-gray-500 rounded-l " placeholder='...'
                    onKeyDown={handleKeyPress} />
            </div>

        </Card>
        );
}

export default RoomChatCard;

// Utility components for common styling
const Card = ({children, title, className = "" }) => {
    return (
        <div className={`p-4 bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-xl shadow-lg ${className}`}>
            {title && <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">{title}</h2>}
            {children}
        </div>
    )
};

export default Card;
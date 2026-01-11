// Utility components for common styling
const Card = ({children, title, className = "", onClick }) => {
    return (
        <div className={`p-4 bg-gray-100 dark:bg-gray-800 border border-[var(--secondary)] dark:border-[var(--secondary-dark)] rounded-xl shadow-lg ${className}`}
            onClick={onClick}>
            {title && <h2 className="text-lg font-semibold mb-3 text-[var(--secondary-dark)] dark:text-[var(--light)]">{title}</h2>}
            {children}
        </div>
    )
};

export default Card;
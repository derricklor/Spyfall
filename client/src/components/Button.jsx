const Button = ({children, onClick, variant, className, disabled}) => {

    function oneShadeDarker(color) {
        //get css custom variable from variant
        const rootStyles = getComputedStyle(document.documentElement);
        let variantColor = rootStyles.getPropertyValue(`--${color}`).trim(); // string of format 'var(--color-cyan-400)'
        //replace with a shade darker
        const regex = /\d/; // find first digit match no g flag
        let string_digit = variantColor.match(regex); // string type
        let darker_digit = parseInt(string_digit,10) + 1; //base10 convert to integer
        variantColor = variantColor.replace(regex, darker_digit); // replace first match of regex
        return variantColor;
    }

    return (
        <button className={`flex items-center justify-center gap-2 space-x-2 py-2 px-4 rounded-3xl transition duration-200 shadow-md 
            bg-[var(--${variant})] dark:bg-[var(--${variant}-darker)] text-[var(--dark)] dark:text-[var(--light)] hover:cursor-pointer ${className}`} 
            disabled={disabled} onClick={()=>onClick}
            >
            {children}
        </button>
    );
};

export default Button;
const Spinner = () => (
    // Spinner component to indicate loading state
    <div className="flex items-center justify-center h-screen">
        <svg
            className="animate-spin h-10 w-10 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2.93 6.93A8.003 8.003 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3.93-1.008zM12 20a8.003 8.003 0 01-6.93-4.07l-3.93 1.008A11.95 11.95 0 0012 24v-4zm6.93-2.07A8.003 8.003 0 0120 12h4c0 3.042-1.135 5.824-3 7.938l-3.07-.938zM20 12a8.003 8.003 0 01-4.07-6.93l3.93-1A11.95 11.95 0 0024 12h-4z"
            ></path>
        </svg>
    </div>
);

export default Spinner;
import { Link } from 'react-router-dom';

function ErrorPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
            <div className="bg-white p-12 rounded-lg shadow-xl max-w-md w-full">
                <h1 className="text-9xl font-black text-indigo-600">404</h1>
                <h2 className="text-3xl font-bold text-gray-800 mt-4">
                    Page Not Found
                </h2>
                <p className="text-gray-600 mt-2 mb-8">
                    Sorry, the page you are looking for does not exist or has been moved.
                </p>
                <Link
                    to="/"
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors duration-300"
                >
                    Go to Homepage
                </Link>
            </div>
        </div>
    );
}

export default ErrorPage;

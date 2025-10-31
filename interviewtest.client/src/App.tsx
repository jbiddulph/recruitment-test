import { Link } from 'react-router-dom';

function App() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="text-center space-y-4">
                <p className="text-slate-700">Welcome. Use the link below to view employees.</p>
                <Link
                    to="/employees"
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Go to Employees
                </Link>
            </div>
        </div>
    );
}

export default App;
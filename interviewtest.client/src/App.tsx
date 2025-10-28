import { Link } from 'react-router-dom';

function App() {
    return (
        <>
            <h2>Home</h2>
            <p>Welcome. Use the link below to view employees.</p>
            <p><Link to="/employees">Go to Employees</Link></p>
        </>
    );
}

export default App;
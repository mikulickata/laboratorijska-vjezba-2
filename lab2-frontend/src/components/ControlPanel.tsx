import React, { useState } from 'react';
import axios from 'axios';

const ControlPanel: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [isProtectionEnabled, setIsProtectionEnabled] = useState<boolean>(false);
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
    const [userData, setUserData] = useState<any>(null);
    const [error, setError] = useState<string>('');

    // Toggle protection status
    const toggleProtection = async () => {
        setUserData(null);
        setError('');

        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/toggleProtection`);
            setIsProtectionEnabled(!isProtectionEnabled);
        } catch (error) {
            console.error('Error toggling protection:', error);
            setError('Error toggling protection');
        }
    };

    // Toggle admin login status
    const toggleAdmin = async () => {
        setUserData(null);
        setError('');

        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/toggleAdmin`);
            setIsAdminLoggedIn(!isAdminLoggedIn);
        } catch (error) {
            console.error('Error toggling admin status:', error);
            setError('Error toggling admin status');
        }
    };

    // Fetch user data based on username and protection status
    const fetchUserData = async () => {
        setUserData(null); // Reset user data
        setError(''); // Clear error

        if (!username) {
        setError('Please enter a username');
        return;
        }

        try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/getUserData`, {
            params: { username },
        });
        setUserData(response.data);
        setError('');
        } catch (error: any) {
        if (error.response) {
            setError(error.response.data);
        } else {
            setError('Something went wrong');
        }
        setUserData(null);
        }
    };

    // Fetch all user data (only for admin when protection is enabled)
    const fetchAllUserData = async () => {
        setUserData(null); // Reset user data
        setError(''); // Clear error

        try {
        if (isProtectionEnabled && !isAdminLoggedIn) {
            setError('Only admins can fetch all data when protection is enabled');
            return;
        }

        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/getAllUserData`, {
            params: { username },
        });
        setUserData(response.data);
        setError('');
        } catch (error: any) {
        if (error.response) {
            setError(error.response.data);
        } else {
            setError('Something went wrong');
        }
        setUserData(null);
        }
    };

    return (
        <div>
            <h2>Control Panel</h2>
            <div>
                <label>Username: </label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Username"
                />
            </div>

            <button onClick={toggleProtection}>
                {isProtectionEnabled ? 'Disable Protection' : 'Enable Protection'}
            </button>
            <button onClick={toggleAdmin}>
                {isAdminLoggedIn ? 'Logout Admin' : 'Login as Admin'}
            </button>

            {/* Novi gumbi za dohvaćanje podataka */}
            <button onClick={fetchUserData}>Fetch Data</button>
            <button onClick={fetchAllUserData}>Fetch All Data</button>

            {/* Greške */}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Prikaz korisničkih podataka */}
            {userData && (
                <div>
                    <h3>User Data</h3>
                    <pre>{JSON.stringify(userData, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default ControlPanel;

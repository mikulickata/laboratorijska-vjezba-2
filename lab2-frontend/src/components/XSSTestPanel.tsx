import React, { useState, useEffect } from 'react';
import axios from 'axios';

const XSSTestPanel: React.FC = () => {
    const [userInput, setUserInput] = useState<string>('');
    const [inputs, setInputs] = useState<any[]>([]);
    const [isXSSEnabled, setIsXSSEnabled] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const toggleXSS = async () => {
        setError('');
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/toggleXSS`);
            setIsXSSEnabled(!isXSSEnabled);
        } catch (error) {
            console.error('Error toggling XSS:', error);
            setError('Error toggling XSS');
        }
    };

    const submitInput = async () => {
        setError('');
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/submitInput`, { content: userInput });
            setUserInput('');
            fetchInputs();
        } catch (error) {
            console.error('Error submitting input:', error);
            setError('Failed to submit input');
        }
    };

    const fetchInputs = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/getInputs`);
            setInputs(response.data);
        } catch (error) {
            console.error('Error fetching inputs:', error);
            setError('Failed to fetch inputs');
        }
    };

    const clearInputs = async () => {
        setError('');
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/clearInputs`);
            console.log("odradila delete");
            setInputs([]); // Resetiraj prikaz
        } catch (error) {
            console.error('Error clearing inputs:', error);
            setError('Failed to clear inputs');
        }
    };

    useEffect(() => {
        fetchInputs();
    }, []);

    return (
        <div>
            <h2>XSS Test Panel</h2>
            <button onClick={toggleXSS}>
                {isXSSEnabled ? 'Disable XSS Vulnerability' : 'Enable XSS Vulnerability'}
            </button>
            <div>
                <label>Enter content:</label>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter some text"
                />
                <button onClick={submitInput}>Submit</button>
            </div>
            <button onClick={clearInputs}>Clear All Inputs</button> {/* Dodani gumb za brisanje */}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <h3>Stored Inputs</h3>
            <div>
                {inputs.map((input, index) => (
                    <p key={index} dangerouslySetInnerHTML={{ __html: input.content }} />
                ))}
            </div>
        </div>
    );
};

export default XSSTestPanel;

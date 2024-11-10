// src/App.tsx
import React from 'react';
import ControlPanel from './components/ControlPanel';
import XSSTestPanel from './components/XSSTestPanel';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Welcome to the User Access Control Panel</h1>
      <ControlPanel />

      {/* Nova komponenta za XSS Test Panel */}
      <XSSTestPanel />
    </div>
  );
};

export default App;

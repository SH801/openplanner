import './App.css';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { setupIonicReact } from '@ionic/react';

// import { createStore, applyMiddleware } from "redux";
// import { Provider } from "react-redux";
// import thunk from "redux-thunk";

import Editor from './components/Editor';
import '@ionic/react/css/core.css';

// let store = createStore(CarbonMapApp, applyMiddleware(thunk));

setupIonicReact();

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Editor />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;

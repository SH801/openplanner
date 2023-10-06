import './App.css';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { setupIonicReact } from '@ionic/react';
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import OpenPlannerApp from "./redux/reducers";
import Editor from './components/Editor';
import '@ionic/react/css/core.css';

let store = createStore(OpenPlannerApp, applyMiddleware(thunk));

setupIonicReact();

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/static/openplanner/index.html" element={<Editor />} />
          <Route path="/" element={<Editor />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;

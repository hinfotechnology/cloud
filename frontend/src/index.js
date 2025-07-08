import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App';
import { AWSCredentialsProvider } from './context/AWSCredentialsContext';
import { SSOAuthProvider } from './context/SSOAuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <SSOAuthProvider>
        <AWSCredentialsProvider>
          <App />
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AWSCredentialsProvider>
      </SSOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import App from './App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitter, faDiscord} from '@fortawesome/free-brands-svg-icons'
import { StarField } from 'starfield-react'
import { render } from 'react-dom'




const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div className='bg-wrap'>
      <StarField noBackground="true" fps={30} className='stars' height={1200} width={1200}></StarField>
    </div>
    <div className="body">
      <header>
        <nav className="navigation">
        <a target='_blank' href='https://twitter.com/Canary_Punks'> <FontAwesomeIcon icon={faTwitter} /> </a>
        <a target='_blank'href='https://discord.com/invite/8cdPB9M3e8'> <FontAwesomeIcon icon={faDiscord} /> </a>  
        </nav>
      </header>
      <App />
      <footer>
        <a href='https://linktr.ee/canary_punks'> © 2023 Canary_Punks </a>
      </footer>
    </div>
  </React.StrictMode>
);


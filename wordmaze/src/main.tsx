import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
// Block page pinch-zoom (iOS ignores user-scalable=no); pinching zooms only the maze.
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
for(const type of ['gesturestart','gesturechange'])document.addEventListener(type,e=>e.preventDefault());
createRoot(document.getElementById('root')!).render(<App/>);

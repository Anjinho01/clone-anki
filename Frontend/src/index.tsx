import './styles/app.css';
import { createRoot } from 'react-dom/client';
import App from 'app/App';

/**
 * The root element of the application.
 */
const container = document.getElementById('root');

if (!container) throw new Error('Failed to find the root element');

/**
 * The root element of the application.
 */
const root = createRoot(container);

root.render(<App />);

export default App;

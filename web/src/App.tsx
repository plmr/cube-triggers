import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <div className="App">
        <header className="app-header">
          <h1>🧩 CubeTriggers</h1>
          <p>Data-driven speedcubing algorithm analysis</p>
        </header>
        <main>
          <Dashboard />
        </main>
      </div>
    </ApolloProvider>
  );
}

export default App;

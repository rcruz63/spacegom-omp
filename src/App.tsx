import { useState } from 'react';
import { GameSave } from './types/game';
import { AccessGate } from './components/AccessGate';
import { SavesManager } from './components/SavesManager';
import { GameDashboard } from './components/GameDashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('spacegom_auth') === 'true';
  });

  const [activeGame, setActiveGame] = useState<GameSave | null>(null);

  const handleUnlock = () => {
    sessionStorage.setItem('spacegom_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleSelectGame = (game: GameSave) => {
    setActiveGame(game);
  };

  const handleExitToMenu = () => {
    setActiveGame(null);
  };

  if (!isAuthenticated) {
    return <AccessGate onUnlock={handleUnlock} />;
  }

  if (!activeGame) {
    return <SavesManager onSelectGame={handleSelectGame} />;
  }

  return (
    <GameDashboard
      game={activeGame}
      onExitToMenu={handleExitToMenu}
    />
  );
}

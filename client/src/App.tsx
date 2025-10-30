import Background from './components/Background';
import GlassCard from './components/GlassCard';
import IconButton from './components/IconButton';

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-fade-in">
      <Background />
      
      <div className="fixed top-10 right-10 z-30">
        <IconButton href="https://discord.gg/your-link" ariaLabel="Discord" />
      </div>

      <GlassCard>
        <h1 
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-white text-glow tracking-tight"
          data-testid="text-title"
        >
          array
        </h1>
      </GlassCard>
    </div>
  );
}

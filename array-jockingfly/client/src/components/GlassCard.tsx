interface GlassCardProps {
  children: React.ReactNode;
}

export default function GlassCard({ children }: GlassCardProps) {
  return (
    <div 
      className="glass-effect rounded-3xl px-12 py-8 shadow-2xl"
      style={{
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)',
      }}
      data-testid="glass-card"
    >
      {children}
    </div>
  );
}

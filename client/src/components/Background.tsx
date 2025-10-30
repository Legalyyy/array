export default function Background() {
  return (
    <div 
      className="fixed inset-0 -z-10"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #161620 50%, #1a1a2e 100%)',
      }}
      data-testid="background"
    >
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(100, 100, 150, 0.1) 0%, transparent 70%)',
        }}
      />
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

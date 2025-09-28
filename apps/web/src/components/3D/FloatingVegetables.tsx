// Simple CSS-based animation fallback for 3D vegetables
export default function FloatingVegetables() {
  const vegetables = [
    { emoji: '🥬', color: 'text-green-400', delay: '0s' },
    { emoji: '🥕', color: 'text-orange-400', delay: '0.5s' },
    { emoji: '🍅', color: 'text-red-400', delay: '1s' },
    { emoji: '🍆', color: 'text-purple-400', delay: '1.5s' },
    { emoji: '🌽', color: 'text-yellow-400', delay: '2s' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {vegetables.map((veg, index) => (
        <div
          key={index}
          className={`absolute text-4xl ${veg.color} animate-float opacity-30`}
          style={{
            left: `${20 + index * 15}%`,
            top: `${30 + (index % 2) * 20}%`,
            animationDelay: veg.delay,
          }}
        >
          {veg.emoji}
        </div>
      ))}
    </div>
  );
}

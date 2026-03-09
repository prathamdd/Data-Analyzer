const getPersonalityStyles = (personality) => {
  switch (personality) {
    case 'The Knee-Jerker': return 'bg-red-100 text-red-700 border-red-200';
    case 'The Diamond Hands': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'The Template Slave': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// Inside your table row:
<span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPersonalityStyles(m.personality)}`}>
  {m.personality}
</span>
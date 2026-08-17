interface Props {
  error: 'city_not_found' | 'ambiguous_city' | 'no_recent_games' | 'api_error';
  message: string;
}

const ERROR_ICONS: Record<string, string> = {
  city_not_found: '📍',
  ambiguous_city: '🗺️',
  no_recent_games: '📅',
  api_error: '📡',
};

export default function ErrorState({ error, message }: Props) {
  return (
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm text-center">
      <p className="text-4xl mb-3">{ERROR_ICONS[error] ?? '❓'}</p>
      <p className="text-white/80 text-sm">{message}</p>
    </div>
  );
}

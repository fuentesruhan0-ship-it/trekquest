import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, icon: Icon, accent = 'bg-primary' }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${accent}`}>
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
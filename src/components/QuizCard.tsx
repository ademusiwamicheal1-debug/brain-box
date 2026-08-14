import React from 'react';
import {
  Play,
  Clock,
  HelpCircle,
  Cpu,
  Atom,
  Landmark,
  Film,
  Globe,
  Sparkles,
  Calculator,
  BookOpen,
  Dna,
  Sprout,
  Palette,
  Music,
  Building2,
  Languages,
  FlaskConical,
  Zap,
} from 'lucide-react';
import { QuizPack } from '../types';

interface QuizCardProps {
  quizPack: QuizPack;
  onStartQuiz: (quizPack: QuizPack) => void;
  primaryColor: string;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quizPack, onStartQuiz, primaryColor }) => {
  const getIcon = () => {
    switch (quizPack.iconName) {
      case 'Cpu':
        return <Cpu className="w-5 h-5" />;
      case 'Atom':
        return <Atom className="w-5 h-5" />;
      case 'Landmark':
        return <Landmark className="w-5 h-5" />;
      case 'Film':
        return <Film className="w-5 h-5" />;
      case 'Globe':
        return <Globe className="w-5 h-5" />;
      case 'Calculator':
        return <Calculator className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Dna':
        return <Dna className="w-5 h-5" />;
      case 'Sprout':
        return <Sprout className="w-5 h-5" />;
      case 'Palette':
        return <Palette className="w-5 h-5" />;
      case 'Music':
        return <Music className="w-5 h-5" />;
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'Languages':
        return <Languages className="w-5 h-5" />;
      case 'FlaskConical':
        return <FlaskConical className="w-5 h-5" />;
      case 'Zap':
        return <Zap className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = () => {
    switch (quizPack.difficulty) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-mono';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-mono';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-mono';
    }
  };

  return (
    <div
      className="group relative app-surface rounded-2xl p-6 app-border border shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden hover:scale-[1.01]"
      id={`quiz-card-${quizPack.id}`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl border transition-colors"
              style={{
                backgroundColor: `rgba(var(--color-primary-rgb), 0.12)`,
                borderColor: `rgba(var(--color-primary-rgb), 0.25)`,
                color: primaryColor,
              }}
            >
              {getIcon()}
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase app-text-muted font-mono">
              {quizPack.category}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getDifficultyColor()}`}
          >
            {quizPack.difficulty}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="font-bold text-base app-text transition-colors mb-2 line-clamp-1">
          {quizPack.title}
        </h3>
        <p className="text-xs app-text-muted leading-relaxed mb-6 line-clamp-2">
          {quizPack.description}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono font-semibold app-text-subtle pt-4 app-border border-t mb-4">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>{quizPack.questions.length} Questions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>30s / Q</span>
          </div>
        </div>

        <button
          onClick={() => onStartQuiz(quizPack)}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: primaryColor }}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Start 30s Challenge
        </button>
      </div>
    </div>
  );
};

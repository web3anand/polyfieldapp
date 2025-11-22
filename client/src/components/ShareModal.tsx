import { X, Download, Share2, Copy, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';
import { ShareCard } from './ShareCard';
import html2canvas from 'html2canvas';
import { toast } from 'sonner@2.0.3';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'position' | 'portfolio';
  data: {
    pnl: number;
    pnlPercentage: string;
    title?: string;
    side?: 'yes' | 'no';
    shares?: number;
    totalValue?: number;
    invested?: number;
    positionsCount?: number;
  };
}

const characterOptions = [
  { id: 'none', name: 'No Character', emoji: '🚫' },
  { id: 'anime-girl-1', name: 'Anime Style 1', emoji: '💫' },
  { id: 'anime-girl-2', name: 'Anime Style 2', emoji: '✨' },
  { id: 'gamer', name: 'Gamer Vibe', emoji: '🎮' },
  { id: 'champion', name: 'Champion', emoji: '🏆' },
  { id: 'cyber', name: 'Cyberpunk', emoji: '🤖' },
];

export function ShareModal({ isOpen, onClose, type, data }: ShareModalProps) {
  const [selectedCharacter, setSelectedCharacter] = useState('anime-girl-1');
  const [characterPosition, setCharacterPosition] = useState<'left' | 'right' | 'bottom'>('right');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    const element = document.getElementById('share-card');
    if (!element) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `polyfield-${type}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Card downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate card');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const element = document.getElementById('share-card');
    if (!element) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        if (navigator.share && navigator.canShare({ files: [new File([blob], 'polyfield.png', { type: 'image/png' })] })) {
          try {
            await navigator.share({
              files: [new File([blob], 'polyfield.png', { type: 'image/png' })],
              title: 'PolyField Trading Performance',
              text: `Check out my ${type === 'portfolio' ? 'portfolio' : 'position'} performance! ${data.pnlPercentage}% ${data.pnl >= 0 ? 'gains' : 'loss'} 🚀`,
            });
            toast.success('Shared successfully!');
          } catch (err) {
            console.error('Share failed:', err);
          }
        } else {
          // Fallback to copying to clipboard
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            toast.success('Image copied to clipboard!');
          } catch (err) {
            toast.error('Failed to copy. Try downloading instead.');
          }
        }
      });
    } catch (error) {
      toast.error('Failed to generate card');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden border-2 border-[var(--border-color)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-xl">Share Your Flex 🔥</h2>
              <p className="text-[var(--text-muted)] text-sm">Create an epic card to share your gains!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="flex gap-6 p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Customization Panel */}
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-3 flex items-center gap-2">
                <span>🎭</span> Choose Character
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {characterOptions.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedCharacter === char.id
                        ? 'border-indigo-500 bg-indigo-500/20'
                        : 'border-[var(--border-color)] bg-[var(--hover-bg)] hover:bg-[var(--active-bg)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{char.emoji}</span>
                      <span className="text-[var(--text-primary)] font-medium text-sm">{char.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[var(--text-primary)] font-semibold mb-3 flex items-center gap-2">
                <span>📍</span> Character Position
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {['left', 'right', 'bottom'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setCharacterPosition(pos as 'left' | 'right' | 'bottom')}
                    className={`px-4 py-2 rounded-xl border-2 transition-all capitalize font-medium ${
                      characterPosition === pos
                        ? 'border-pink-500 bg-pink-500/20 text-pink-400'
                        : 'border-[var(--border-color)] bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:bg-[var(--active-bg)]'
                    }`}
                    disabled={selectedCharacter === 'none'}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full btn-retro bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {isGenerating ? 'Generating...' : 'Download Card'}
              </button>

              <button
                onClick={handleShare}
                disabled={isGenerating}
                className="w-full btn-retro bg-gradient-to-r from-pink-600 to-purple-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                <Share2 className="w-5 h-5" />
                {isGenerating ? 'Generating...' : 'Share Card'}
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-yellow-600 dark:text-yellow-400 text-xs leading-relaxed">
                💡 <strong>Tip:</strong> Cards are generated at high resolution (2x) for crystal clear sharing on social media!
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1">
            <h3 className="text-[var(--text-primary)] font-semibold mb-3 flex items-center gap-2">
              <span>👁️</span> Preview
            </h3>
            <div className="bg-[var(--hover-bg)] rounded-2xl p-4 border border-[var(--border-color)]">
              <div 
                ref={cardRef}
                className="overflow-hidden rounded-xl"
                style={{
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                  width: '200%',
                  height: 'auto'
                }}
              >
                <ShareCard
                  type={type}
                  pnl={data.pnl}
                  pnlPercentage={data.pnlPercentage}
                  title={data.title}
                  side={data.side}
                  shares={data.shares}
                  totalValue={data.totalValue}
                  invested={data.invested}
                  positionsCount={data.positionsCount}
                  character={selectedCharacter}
                  characterPosition={characterPosition}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

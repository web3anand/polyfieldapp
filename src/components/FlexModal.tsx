import { X, Download, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { FlexCard } from './FlexCard';
import html2canvas from 'html2canvas';
import { toast } from 'sonner@2.0.3';

interface FlexModalProps {
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
  { id: 'superman', name: 'Superman', emoji: '🦸' },
  { id: 'money', name: 'Money Guy', emoji: '💰' },
  { id: 'cloud', name: 'Cloud Hand', emoji: '☁️' },
];

export function FlexModal({ isOpen, onClose, type, data }: FlexModalProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<'superman' | 'money' | 'cloud'>('superman');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    const element = document.getElementById('flex-card');
    if (!element) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `polyfield-flex-${type}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('💾 Flex card downloaded!');
    } catch (error) {
      toast.error('Failed to generate card');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const element = document.getElementById('flex-card');
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

        if (navigator.share && navigator.canShare({ files: [new File([blob], 'polyfield-flex.png', { type: 'image/png' })] })) {
          try {
            await navigator.share({
              files: [new File([blob], 'polyfield-flex.png', { type: 'image/png' })],
              title: 'PolyField Trading Flex',
              text: `🚀 ${data.pnlPercentage}% ${data.pnl >= 0 ? 'gains' : 'loss'} on PolyField!`,
            });
            toast.success('📤 Shared successfully!');
          } catch (err) {
            console.error('Share failed:', err);
          }
        } else {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            toast.success('📋 Image copied to clipboard!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden border-2 border-[var(--border-color)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-[var(--text-primary)] font-semibold">Share Card</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Preview */}
          <div className="mb-4 flex justify-center">
            <div 
              className="overflow-hidden rounded-lg border border-[var(--border-color)] flex items-center justify-center"
              style={{
                width: '576px', // 16:9 ratio
                height: '324px',
              }}
            >
              <div
                style={{
                  transform: 'scale(0.3)',
                  transformOrigin: 'center center',
                }}
              >
                <FlexCard
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
                />
              </div>
            </div>
          </div>

          {/* Character Selection */}
          <div className="mb-4">
            <h3 className="text-[var(--text-primary)] font-semibold mb-2 text-sm">Choose Character</h3>
            <div className="grid grid-cols-4 gap-2">
              {characterOptions.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char.id as any)}
                  className={`p-2 rounded-lg border transition-all ${
                    selectedCharacter === char.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-[var(--border-color)] bg-[var(--hover-bg)] hover:border-purple-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{char.emoji}</div>
                    <div className="text-[var(--text-primary)] text-xs">{char.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Download'}</span>
            </button>

            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
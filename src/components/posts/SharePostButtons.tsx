import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Share2, 
  Copy, 
  Check,
  Download,
  MessageCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SharePostButtonsProps {
  postId: string;
  creatorUsername: string;
  imageUrl: string;
  caption?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export function SharePostButtons({
  postId,
  creatorUsername,
  imageUrl,
  caption,
  variant = 'default',
  className,
}: SharePostButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareUrl = `${window.location.origin}/posts/${postId}?utm_source=share&utm_medium=social`;
  const shareText = caption 
    ? `${caption.slice(0, 100)}${caption.length > 100 ? '...' : ''}`
    : `Olha esse post de @${creatorUsername} no Diderot!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleWhatsApp = () => {
    const text = `${shareText}\n\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTwitter = () => {
    const text = `${shareText} via @diderot_app`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Create a canvas to add watermark
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Add watermark
      const watermarkHeight = Math.max(30, img.height * 0.04);
      const padding = 10;

      // Watermark background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, img.height - watermarkHeight - padding * 2, img.width, watermarkHeight + padding * 2);

      // Watermark text
      ctx.fillStyle = 'white';
      ctx.font = `bold ${watermarkHeight * 0.6}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`diderot.app/@${creatorUsername}`, img.width / 2, img.height - watermarkHeight / 2 - padding);

      // Download
      const link = document.createElement('a');
      link.download = `diderot-${creatorUsername}-${postId.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Imagem baixada com sucesso!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erro ao baixar imagem. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className={className}>
            <Share2 className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleWhatsApp}>
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTwitter}>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter/X
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copiar link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload} disabled={downloading}>
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Baixando...' : 'Baixar imagem'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button variant="outline" size="sm" onClick={handleWhatsApp}>
        <MessageCircle className="w-4 h-4 mr-2" />
        WhatsApp
      </Button>
      <Button variant="outline" size="sm" onClick={handleTwitter}>
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Twitter
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopyLink}>
        {copied ? (
          <Check className="w-4 h-4 mr-2" />
        ) : (
          <Copy className="w-4 h-4 mr-2" />
        )}
        {copied ? 'Copiado!' : 'Copiar link'}
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDownload}
        disabled={downloading}
      >
        <Download className="w-4 h-4 mr-2" />
        {downloading ? 'Baixando...' : 'Baixar'}
      </Button>
    </div>
  );
}

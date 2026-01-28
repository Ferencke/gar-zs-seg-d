import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Share2, 
  Copy, 
  Check,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
}

export function ShareReminderDialog({
  open,
  onOpenChange,
  title,
  message,
}: ShareReminderDialogProps) {
  const [editedMessage, setEditedMessage] = useState(message);
  const [copied, setCopied] = useState(false);

  // Frissíti az üzenetet minden megnyitáskor
  useEffect(() => {
    if (open) {
      setEditedMessage(message);
    }
  }, [open, message]);

  const handleShare = async (method: 'native' | 'whatsapp' | 'sms' | 'email' | 'copy') => {
    const encodedMessage = encodeURIComponent(editedMessage);

    switch (method) {
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              text: editedMessage,
            });
            toast.success('Megosztva!');
            onOpenChange(false);
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              toast.error('Nem sikerült megosztani');
            }
          }
        } else {
          toast.error('A megosztás nem támogatott ezen az eszközön');
        }
        break;

      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        onOpenChange(false);
        break;

      case 'sms':
        window.open(`sms:?body=${encodedMessage}`, '_blank');
        onOpenChange(false);
        break;

      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodedMessage}`, '_blank');
        onOpenChange(false);
        break;

      case 'copy':
        try {
          await navigator.clipboard.writeText(editedMessage);
          setCopied(true);
          toast.success('Szöveg másolva!');
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error('Nem sikerült másolni');
        }
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Emlékeztető küldése
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Üzenet szerkesztése:
            </label>
            <Textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {navigator.share && (
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12"
                onClick={() => handleShare('native')}
              >
                <Smartphone className="h-5 w-5 text-blue-500" />
                <span>Megosztás...</span>
              </Button>
            )}

            <Button
              variant="outline"
              className="flex items-center gap-2 h-12"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              <span>WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-12"
              onClick={() => handleShare('sms')}
            >
              <Phone className="h-5 w-5 text-blue-600" />
              <span>SMS</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-12"
              onClick={() => handleShare('email')}
            >
              <Mail className="h-5 w-5 text-orange-500" />
              <span>Email</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-12 col-span-2"
              onClick={() => handleShare('copy')}
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 text-muted-foreground" />
              )}
              <span>{copied ? 'Másolva!' : 'Szöveg másolása'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

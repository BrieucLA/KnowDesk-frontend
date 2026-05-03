import React, { useEffect, useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { useToast } from '../../../shared/lib/useToast';
import { formatRelative } from '../../../shared/lib/formatDate';
import { chatsApi, type ChatDetail } from '../api/chatsApi';

interface TranscriptModalProps {
  chatId:  string;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  active:    'En cours',
  resolved:  'Résolue',
  escalated: 'Escaladée',
  abandoned: 'Abandonnée',
};

export function TranscriptModal({ chatId, onClose }: TranscriptModalProps) {
  const toast = useToast();
  const [detail, setDetail]   = useState<ChatDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    chatsApi.get(chatId)
      .then(res => { if (alive) setDetail(res); })
      .catch(err => {
        if (!alive) return;
        toast.error(err?.message ?? 'Impossible de charger la transcription.');
        onClose();
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [chatId, toast, onClose]);

  return (
    <Modal
      title={detail?.topic ?? 'Conversation'}
      size="lg"
      onClose={onClose}
    >
      {loading || !detail ? (
        <div className="chat-transcript__loading">
          <Skeleton className="chat-transcript__loading-row" />
          <Skeleton className="chat-transcript__loading-row chat-transcript__loading-row--short" />
          <Skeleton className="chat-transcript__loading-row" />
        </div>
      ) : (
        <div className="chat-transcript">
          <dl className="chat-transcript__meta">
            <div>
              <dt>Statut</dt>
              <dd>{STATUS_LABEL[detail.status] ?? detail.status}</dd>
            </div>
            <div>
              <dt>Démarrée</dt>
              <dd>{formatRelative(detail.startedAt)}</dd>
            </div>
            {detail.endedAt && (
              <div>
                <dt>Terminée</dt>
                <dd>{formatRelative(detail.endedAt)}</dd>
              </div>
            )}
            <div>
              <dt>Messages</dt>
              <dd>{detail.turns.length}</dd>
            </div>
            {detail.csat !== null && (
              <div>
                <dt>CSAT</dt>
                <dd>{'★'.repeat(detail.csat)}{'☆'.repeat(5 - detail.csat)}</dd>
              </div>
            )}
            {detail.resolvedHelpful !== null && (
              <div>
                <dt>Retour</dt>
                <dd>{detail.resolvedHelpful ? '👍 Utile' : '👎 Non utile'}</dd>
              </div>
            )}
          </dl>

          <div className="chat-transcript__body">
            {detail.turns.map(t => {
              const isVisitor = t.role === 'visitor' || t.role === 'user';
              return (
                <div
                  key={t.id}
                  className={`chat-transcript__msg chat-transcript__msg--${isVisitor ? 'visitor' : 'bot'}`}
                >
                  <div className="chat-transcript__bubble">
                    {t.content}
                  </div>
                  <div className="chat-transcript__time">
                    {formatRelative(t.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

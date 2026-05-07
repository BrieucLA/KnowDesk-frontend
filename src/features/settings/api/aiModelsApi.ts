import { apiClient } from '../../../shared/lib/apiClient';
import type { AiServicesPayload, ChatModelId } from '../types';

export const aiModelsApi = {
  /** Liste des 4 services IA + modèles disponibles. Admin only. */
  list(): Promise<AiServicesPayload> {
    return apiClient.get<AiServicesPayload>('/settings/org/ai-services');
  },

  /** Bascule du modèle utilisé par le chatbot. Admin only.
   *  Effet immédiat sur le prochain turn bot, y compris conversations actives. */
  updateChatModel(model: ChatModelId): Promise<{ chat_model: ChatModelId }> {
    return apiClient.patch<{ chat_model: ChatModelId }>('/settings/org/chat/model', { model });
  },
};

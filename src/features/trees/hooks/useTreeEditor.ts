import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';
import type { QuestionTree, TreeNode, NodeAnswer } from '../types';

export function useTreeEditor(treeId: string) {
  const [tree,    setTree]    = useState<QuestionTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<QuestionTree>(`/trees/${treeId}`);
      setTree(data);
    } catch { /* silencieux */ } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => { load(); }, [load]);

  const updateTree = useCallback(async (patch: {
    title?: string; description?: string; categoryId?: string | null;
  }) => {
    const updated = await apiClient.patch<QuestionTree>(`/trees/${treeId}`, patch);
    setTree(updated);
  }, [treeId]);

  const publishTree = useCallback(async () => {
    const updated = await apiClient.put<QuestionTree>(`/trees/${treeId}/publish`);
    setTree(updated);
  }, [treeId]);

  const addNode = useCallback(async (payload: {
    type: 'question' | 'conclusion';
    content: string;
    parentId?: string | null;
    parentAnswerId?: string | null;
    articleId?: string | null;
    position?: number;
  }) => {
    const node = await apiClient.post<TreeNode>(`/trees/${treeId}/nodes`, payload);
    setTree(prev => prev ? { ...prev, nodes: [...prev.nodes, { ...node, answers: [] }] } : prev);
    return node;
  }, [treeId]);

  const updateNode = useCallback(async (nodeId: string, patch: {
    content?: string; articleId?: string | null; position?: number;
  }) => {
    const node = await apiClient.patch<TreeNode>(`/trees/${treeId}/nodes/${nodeId}`, patch);
    setTree(prev => prev ? {
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...node, answers: n.answers } : n),
    } : prev);
  }, [treeId]);

  const deleteNode = useCallback(async (nodeId: string) => {
    await apiClient.delete(`/trees/${treeId}/nodes/${nodeId}`);
    // Supprime le nœud et tous ses descendants
    setTree(prev => {
      if (!prev) return prev;
      const toDelete = new Set<string>();
      const collect = (id: string) => {
        toDelete.add(id);
        prev.nodes
          .filter(n => n.parent_id === id)
          .forEach(n => collect(n.id));
      };
      collect(nodeId);
      return { ...prev, nodes: prev.nodes.filter(n => !toDelete.has(n.id)) };
    });
  }, [treeId]);

  const addAnswer = useCallback(async (nodeId: string, payload: {
    label: string; position?: number;
  }) => {
    const answer = await apiClient.post<NodeAnswer>(
      `/trees/${treeId}/nodes/${nodeId}/answers`, payload
    );
    setTree(prev => prev ? {
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, answers: [...n.answers, answer] } : n
      ),
    } : prev);
    return answer;
  }, [treeId]);

  const updateAnswer = useCallback(async (nodeId: string, answerId: string, patch: {
    label?: string; position?: number;
  }) => {
    const answer = await apiClient.patch<NodeAnswer>(
      `/trees/${treeId}/nodes/${nodeId}/answers/${answerId}`, patch
    );
    setTree(prev => prev ? {
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId
          ? { ...n, answers: n.answers.map(a => a.id === answerId ? answer : a) }
          : n
      ),
    } : prev);
  }, [treeId]);

  const deleteAnswer = useCallback(async (nodeId: string, answerId: string) => {
    await apiClient.delete(`/trees/${treeId}/nodes/${nodeId}/answers/${answerId}`);
    setTree(prev => prev ? {
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId
          ? { ...n, answers: n.answers.filter(a => a.id !== answerId) }
          : n
      ),
    } : prev);
  }, [treeId]);

  return {
    tree, loading, saving,
    load, updateTree, publishTree,
    addNode, updateNode, deleteNode,
    addAnswer, updateAnswer, deleteAnswer,
  };
}

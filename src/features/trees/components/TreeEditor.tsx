import React, { useState, useCallback } from 'react';
import { useTreeEditor }  from '../hooks/useTreeEditor';
import { Button }         from '../../../shared/components/ui/Button';
import { Skeleton }       from '../../../shared/components/ui/Skeleton';
import { useToast }       from '../../../shared/lib/useToast';
import type { TreeNode, NodeAnswer } from '../types';

interface TreeEditorProps {
  treeId:   string;
  onBack:   () => void;
  onPreview: (treeId: string) => void;
}

export function TreeEditor({ treeId, onBack, onPreview }: TreeEditorProps) {
  const toast = useToast();
  const {
    tree, loading,
    updateTree, publishTree,
    addNode, updateNode, deleteNode,
    addAnswer, updateAnswer, deleteAnswer,
  } = useTreeEditor(treeId);

  const [editingTitle,   setEditingTitle]   = useState(false);
  const [titleDraft,     setTitleDraft]     = useState('');
  const [addingNode,     setAddingNode]     = useState<{
    parentId: string | null; parentAnswerId: string | null;
  } | null>(null);
  const [nodeDraft,      setNodeDraft]      = useState('');
  const [nodeType,       setNodeType]       = useState<'question' | 'conclusion'>('question');
  const [editingNode,    setEditingNode]    = useState<string | null>(null);
  const [nodeEditDraft,  setNodeEditDraft]  = useState('');
  const [addingAnswer,   setAddingAnswer]   = useState<string | null>(null);
  const [answerDraft,    setAnswerDraft]    = useState('');
  const [publishing,     setPublishing]     = useState(false);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      await publishTree();
      toast.success('Processus publié !');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la publication.');
    } finally {
      setPublishing(false);
    }
  }, [publishTree, toast]);

  const handleSaveTitle = useCallback(async () => {
    if (!titleDraft.trim()) return;
    await updateTree({ title: titleDraft.trim() });
    setEditingTitle(false);
    toast.success('Titre mis à jour.');
  }, [titleDraft, updateTree, toast]);

  const handleAddNode = useCallback(async () => {
    if (!nodeDraft.trim() || !addingNode) return;
    await addNode({
      type:           nodeType,
      content:        nodeDraft.trim(),
      parentId:       addingNode.parentId,
      parentAnswerId: addingNode.parentAnswerId,
      position:       0,
    });
    setNodeDraft('');
    setAddingNode(null);
    toast.success('Nœud ajouté.');
  }, [nodeDraft, nodeType, addingNode, addNode, toast]);

  const handleUpdateNode = useCallback(async (nodeId: string) => {
    if (!nodeEditDraft.trim()) return;
    await updateNode(nodeId, { content: nodeEditDraft.trim() });
    setEditingNode(null);
    toast.success('Nœud modifié.');
  }, [nodeEditDraft, updateNode, toast]);

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    if (!confirm('Supprimer ce nœud et tous ses descendants ?')) return;
    await deleteNode(nodeId);
    toast.success('Nœud supprimé.');
  }, [deleteNode, toast]);

  const handleAddAnswer = useCallback(async (nodeId: string) => {
    if (!answerDraft.trim()) return;
    await addAnswer(nodeId, { label: answerDraft.trim() });
    setAnswerDraft('');
    setAddingAnswer(null);
    toast.success('Réponse ajoutée.');
  }, [answerDraft, addAnswer, toast]);

  const handleDeleteAnswer = useCallback(async (nodeId: string, answerId: string) => {
    await deleteAnswer(nodeId, answerId);
    toast.success('Réponse supprimée.');
  }, [deleteAnswer, toast]);

  if (loading) return (
    <div className="tree-editor">
      <Skeleton className="sk-title" />
      <Skeleton className="sk-p" />
    </div>
  );

  if (!tree) return (
    <div className="tree-editor tree-editor--error">
      <p>Processus introuvable.</p>
      <Button variant="ghost" size="sm" onClick={onBack}>← Retour</Button>
    </div>
  );

  // Nœuds racines (sans parent)
  const rootNodes = tree.nodes.filter(n => n.parent_id === null);

  const renderNode = (node: TreeNode, depth = 0): React.ReactNode => {
    const childrenByAnswer = node.answers.map(answer => ({
      answer,
      children: tree.nodes.filter(n => n.parent_answer_id === answer.id),
    }));

    return (
      <div key={node.id} className={`tree-node tree-node--${node.type}`} style={{ marginLeft: depth * 24 }}>
        <div className="tree-node__header">
          <span className={`tree-node__badge tree-node__badge--${node.type}`}>
            {node.type === 'question' ? '❓ Question' : '✅ Conclusion'}
          </span>
          <div className="tree-node__actions">
            <button
              type="button"
              className="tree-node__action"
              onClick={() => { setEditingNode(node.id); setNodeEditDraft(node.content); }}
              title="Modifier"
            >✏️</button>
            <button
              type="button"
              className="tree-node__action tree-node__action--danger"
              onClick={() => handleDeleteNode(node.id)}
              title="Supprimer"
            >🗑</button>
          </div>
        </div>

        {editingNode === node.id ? (
          <div className="tree-node__edit">
            <textarea
              className="tree-node__textarea"
              value={nodeEditDraft}
              onChange={e => setNodeEditDraft(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="tree-node__edit-actions">
              <Button variant="primary" size="sm" onClick={() => handleUpdateNode(node.id)}>Sauvegarder</Button>
              <Button variant="ghost"   size="sm" onClick={() => setEditingNode(null)}>Annuler</Button>
            </div>
          </div>
        ) : (
          <p className="tree-node__content">{node.content}</p>
        )}

        {node.type === 'question' && (
          <div className="tree-node__answers">
            {node.answers.map(answer => (
              <div key={answer.id} className="tree-answer">
                <div className="tree-answer__header">
                  <span className="tree-answer__label">→ {answer.label}</span>
                  <button
                    type="button"
                    className="tree-answer__delete"
                    onClick={() => handleDeleteAnswer(node.id, answer.id)}
                    title="Supprimer cette réponse"
                  >×</button>
                </div>
                {/* Nœuds enfants de cette réponse */}
                {tree.nodes
                  .filter(n => n.parent_answer_id === answer.id)
                  .map(child => renderNode(child, depth + 1))
                }
                {/* Bouton pour ajouter un nœud sous cette réponse */}
                {addingNode?.parentAnswerId === answer.id ? (
                  <div className="tree-add-node" style={{ marginLeft: (depth + 1) * 24 }}>
                    <select
                      className="field-input tree-add-node__type"
                      value={nodeType}
                      onChange={e => setNodeType(e.target.value as 'question' | 'conclusion')}
                    >
                      <option value="question">Question</option>
                      <option value="conclusion">Conclusion</option>
                    </select>
                    <textarea
                      className="tree-node__textarea"
                      placeholder={nodeType === 'question' ? 'Saisir la question…' : 'Saisir la conclusion…'}
                      value={nodeDraft}
                      onChange={e => setNodeDraft(e.target.value)}
                      rows={2}
                      autoFocus
                    />
                    <div className="tree-node__edit-actions">
                      <Button variant="primary" size="sm" onClick={handleAddNode}>Ajouter</Button>
                      <Button variant="ghost"   size="sm" onClick={() => setAddingNode(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="tree-add-child"
                    style={{ marginLeft: (depth + 1) * 24 }}
                    onClick={() => setAddingNode({ parentId: node.id, parentAnswerId: answer.id })}
                  >
                    + Ajouter un nœud
                  </button>
                )}
              </div>
            ))}

            {/* Bouton pour ajouter une réponse */}
            {addingAnswer === node.id ? (
              <div className="tree-add-answer">
                <input
                  type="text"
                  className="field-input"
                  placeholder="Libellé de la réponse…"
                  value={answerDraft}
                  onChange={e => setAnswerDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddAnswer(node.id); }}
                  autoFocus
                />
                <div className="tree-node__edit-actions">
                  <Button variant="primary" size="sm" onClick={() => handleAddAnswer(node.id)}>Ajouter</Button>
                  <Button variant="ghost"   size="sm" onClick={() => setAddingAnswer(null)}>Annuler</Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="tree-add-answer-btn"
                onClick={() => setAddingAnswer(node.id)}
              >
                + Ajouter une réponse
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tree-editor">
      {/* Topbar */}
      <div className="tree-editor__topbar">
        <button type="button" className="tree-editor__back" onClick={onBack}>← Retour</button>
        <div className="tree-editor__topbar-center">
          {editingTitle ? (
            <div className="tree-editor__title-edit">
              <input
                type="text"
                className="tree-editor__title-input"
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                autoFocus
              />
              <Button variant="primary" size="sm" onClick={handleSaveTitle}>OK</Button>
              <Button variant="ghost"   size="sm" onClick={() => setEditingTitle(false)}>Annuler</Button>
            </div>
          ) : (
            <button
              type="button"
              className="tree-editor__title"
              onClick={() => { setTitleDraft(tree.title); setEditingTitle(true); }}
              title="Cliquer pour modifier"
            >
              {tree.title} ✏️
            </button>
          )}
        </div>
        <div className="tree-editor__topbar-actions">
          <Button variant="ghost"   size="sm" onClick={() => onPreview(treeId)}>Aperçu conseiller</Button>
          <Button
            variant="primary" size="sm"
            loading={publishing}
            onClick={handlePublish}
            disabled={tree.status === 'published'}
          >
            {tree.status === 'published' ? 'Publié' : 'Publier'}
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="tree-editor__canvas">
        {rootNodes.length === 0 && (
          <div className="tree-editor__empty">
            <p>Aucun nœud pour l'instant.</p>
            <p>Ajoutez un premier point d'entrée ci-dessous.</p>
          </div>
        )}

        {/* Nœuds racines */}
        <div className="tree-roots">
          {rootNodes.map(node => renderNode(node))}
        </div>

        {/* Bouton pour ajouter un nœud racine */}
        {addingNode?.parentId === null && addingNode?.parentAnswerId === null ? (
          <div className="tree-add-node tree-add-node--root">
            <select
              className="field-input tree-add-node__type"
              value={nodeType}
              onChange={e => setNodeType(e.target.value as 'question' | 'conclusion')}
            >
              <option value="question">Question</option>
              <option value="conclusion">Conclusion</option>
            </select>
            <textarea
              className="tree-node__textarea"
              placeholder={nodeType === 'question' ? 'Saisir la question…' : 'Saisir la conclusion…'}
              value={nodeDraft}
              onChange={e => setNodeDraft(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="tree-node__edit-actions">
              <Button variant="primary" size="sm" onClick={handleAddNode}>Ajouter</Button>
              <Button variant="ghost"   size="sm" onClick={() => setAddingNode(null)}>Annuler</Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="tree-add-root"
            onClick={() => setAddingNode({ parentId: null, parentAnswerId: null })}
          >
            + Ajouter un point d'entrée
          </button>
        )}
      </div>
    </div>
  );
}

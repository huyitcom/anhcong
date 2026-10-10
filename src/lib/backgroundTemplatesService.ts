import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BackgroundTemplate,
  backgroundTemplates as staticTemplates,
  BACKGROUND_CATEGORIES,
} from '../data/backgroundTemplates';

export interface ExtendedBackgroundTemplate extends BackgroundTemplate {
  isActive?: boolean;
  order?: number;
  isCustom?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export function useBackgroundTemplates() {
  const [firestoreTemplates, setFirestoreTemplates] = useState<ExtendedBackgroundTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Firestore collection
  useEffect(() => {
    const templatesCol = collection(db, 'aiBackgroundTemplates');
    const unsub = onSnapshot(
      templatesCol,
      (snapshot) => {
        const list: ExtendedBackgroundTemplate[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setFirestoreTemplates(list);
        setLoading(false);
      },
      (err) => {
        console.warn('[BackgroundTemplatesService] Firestore snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Merge static templates with Firestore custom/overrides
  // If Firestore has items, matching IDs override static; additional IDs are appended;
  // If an item in Firestore has isActive === false, it's marked as inactive.
  const mergedTemplates: ExtendedBackgroundTemplate[] = (() => {
    if (firestoreTemplates.length === 0) {
      return staticTemplates.map((t, index) => ({
        ...t,
        order: index,
        isActive: true,
        isCustom: false,
      }));
    }

    const firestoreMap = new Map<string, ExtendedBackgroundTemplate>();
    firestoreTemplates.forEach((item) => {
      firestoreMap.set(item.id, item);
    });

    const result: ExtendedBackgroundTemplate[] = [];
    const visitedIds = new Set<string>();

    // First process static templates in original order
    staticTemplates.forEach((st, idx) => {
      visitedIds.add(st.id);
      if (firestoreMap.has(st.id)) {
        const fsItem = firestoreMap.get(st.id)!;
        result.push({
          ...st,
          ...fsItem,
          order: fsItem.order ?? idx,
          isActive: fsItem.isActive !== false,
          isCustom: false,
        });
      } else {
        result.push({
          ...st,
          order: idx,
          isActive: true,
          isCustom: false,
        });
      }
    });

    // Then append any newly created custom templates from Firestore
    firestoreTemplates.forEach((fsItem) => {
      if (!visitedIds.has(fsItem.id)) {
        result.push({
          ...fsItem,
          order: fsItem.order ?? result.length,
          isActive: fsItem.isActive !== false,
          isCustom: true,
        });
      }
    });

    // Sort by order
    result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return result;
  })();

  // Filter only active templates for user view / picker
  const activeTemplates = mergedTemplates.filter((t) => t.isActive !== false);

  // Admin action: Save/Update template
  const saveTemplate = async (tmpl: Partial<ExtendedBackgroundTemplate> & { id: string }) => {
    try {
      const docRef = doc(db, 'aiBackgroundTemplates', tmpl.id);
      await setDoc(
        docRef,
        {
          ...tmpl,
          isActive: tmpl.isActive !== false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    } catch (err: any) {
      console.error('[Admin] Error saving template:', err);
      throw err;
    }
  };

  // Admin action: Toggle Active
  const toggleTemplateActive = async (templateId: string, isActive: boolean) => {
    try {
      const docRef = doc(db, 'aiBackgroundTemplates', templateId);
      const existing = firestoreTemplates.find((t) => t.id === templateId);
      if (existing) {
        await updateDoc(docRef, {
          isActive,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Find in static templates and copy to Firestore with new active state
        const st = staticTemplates.find((t) => t.id === templateId);
        if (st) {
          await setDoc(docRef, {
            ...st,
            isActive,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
      return true;
    } catch (err: any) {
      console.error('[Admin] Error toggling template active:', err);
      throw err;
    }
  };

  // Admin action: Delete template
  const deleteTemplate = async (templateId: string) => {
    try {
      const docRef = doc(db, 'aiBackgroundTemplates', templateId);
      const isStatic = staticTemplates.some((t) => t.id === templateId);
      if (isStatic) {
        // If static, soft delete by marking isActive = false in Firestore
        await setDoc(docRef, {
          isActive: false,
          deletedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        // If pure custom, remove document
        await deleteDoc(docRef);
      }
      return true;
    } catch (err: any) {
      console.error('[Admin] Error deleting template:', err);
      throw err;
    }
  };

  // Admin action: Seed / Sync all static templates to Firestore
  const seedDefaultTemplates = async () => {
    try {
      const batch = writeBatch(db);
      staticTemplates.forEach((t, idx) => {
        const docRef = doc(db, 'aiBackgroundTemplates', t.id);
        batch.set(
          docRef,
          {
            ...t,
            order: idx,
            isActive: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
      await batch.commit();
      return true;
    } catch (err: any) {
      console.error('[Admin] Error seeding templates:', err);
      throw err;
    }
  };

  // System Master Prompt (stored in systemSettings/masterPrompt)
  const [systemMasterPrompt, setSystemMasterPrompt] = useState<string>('');

  useEffect(() => {
    const promptDocRef = doc(db, 'systemSettings', 'masterPrompt');
    const unsub = onSnapshot(promptDocRef, (snap) => {
      if (snap.exists() && snap.data()?.value) {
        setSystemMasterPrompt(snap.data().value);
      }
    });
    return () => unsub();
  }, []);

  const saveSystemMasterPrompt = async (promptValue: string) => {
    try {
      const promptDocRef = doc(db, 'systemSettings', 'masterPrompt');
      await setDoc(
        promptDocRef,
        {
          id: 'masterPrompt',
          value: promptValue,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('[Admin] Error saving system master prompt:', err);
      throw err;
    }
  };

  return {
    allTemplates: mergedTemplates,
    activeTemplates,
    categories: BACKGROUND_CATEGORIES,
    loading,
    error,
    saveTemplate,
    toggleTemplateActive,
    deleteTemplate,
    seedDefaultTemplates,
    systemMasterPrompt,
    saveSystemMasterPrompt,
  };
}

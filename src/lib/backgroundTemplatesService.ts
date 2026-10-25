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

  // Helper to extract timestamp in ms from various formats (Firestore Timestamp, Date, or number)
  const extractMs = (val: any): number | null => {
    if (!val) return null;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    if (typeof val === 'number') return val;
    if (val instanceof Date) return val.getTime();
    return null;
  };

  // Merge static templates with Firestore custom/overrides
  // Order: MỚI XUẤT HIỆN TRƯỚC, CŨ XUẤT HIỆN SAU (Newest templates first, oldest last)
  const mergedTemplates: ExtendedBackgroundTemplate[] = (() => {
    const staticOrderMap = new Map<string, number>();
    staticTemplates.forEach((st, idx) => {
      staticOrderMap.set(st.id, idx);
    });

    if (firestoreTemplates.length === 0) {
      // Reverse static templates so newer templates appear first
      return [...staticTemplates].reverse().map((t, index) => ({
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

    // 1. Process custom templates from Firestore (not in static list)
    firestoreTemplates.forEach((fsItem) => {
      const isStatic = staticOrderMap.has(fsItem.id);
      if (!isStatic) {
        visitedIds.add(fsItem.id);
        result.push({
          ...fsItem,
          isActive: fsItem.isActive !== false,
          isCustom: true,
        });
      }
    });

    // 2. Process static templates (with any overrides from Firestore) in reverse order
    [...staticTemplates].reverse().forEach((st) => {
      visitedIds.add(st.id);
      if (firestoreMap.has(st.id)) {
        const fsItem = firestoreMap.get(st.id)!;
        result.push({
          ...st,
          ...fsItem,
          isActive: fsItem.isActive !== false,
          isCustom: false,
        });
      } else {
        result.push({
          ...st,
          isActive: true,
          isCustom: false,
        });
      }
    });

    // 3. Fallback for any other items
    firestoreTemplates.forEach((fsItem) => {
      if (!visitedIds.has(fsItem.id)) {
        visitedIds.add(fsItem.id);
        result.push({
          ...fsItem,
          isActive: fsItem.isActive !== false,
          isCustom: true,
        });
      }
    });

    // Scoring function for sorting: NEWEST FIRST (higher score = appears earlier)
    const getTemplateScore = (tmpl: ExtendedBackgroundTemplate): number => {
      // 1. Explicit createdAt has highest authority
      const createdMs = extractMs(tmpl.createdAt);
      if (createdMs !== null) return createdMs;

      // 2. Explicit updatedAt
      const updatedMs = extractMs(tmpl.updatedAt);
      if (updatedMs !== null) return updatedMs;

      // 3. Timestamp inside ID: e.g. custom-template-1729123456789
      const matchTs = tmpl.id?.match(/(\d{6,14})$/);
      if (matchTs) {
        const parsed = parseInt(matchTs[1], 10);
        if (!isNaN(parsed)) {
          if (parsed > 1e11) return parsed; // 13-digit ms
          if (parsed > 1e8) return parsed * 1000; // 10-digit sec
          if (parsed > 1000) return 1700000000000 + parsed;
        }
      }

      // 4. Custom templates created in Firestore without explicit timestamp
      if (tmpl.isCustom) {
        return 1600000000000 + (tmpl.order ?? 0);
      }

      // 5. Static templates: higher index in staticTemplates = newer
      const staticIdx = staticOrderMap.get(tmpl.id) ?? 0;
      return 1000000000000 + staticIdx;
    };

    // Sort descending: highest score (newest) first!
    result.sort((a, b) => getTemplateScore(b) - getTemplateScore(a));

    // Re-index order property
    result.forEach((item, index) => {
      item.order = index;
    });

    return result;
  })();

  // Filter only active templates for user view / picker (preserving newest-first order)
  const activeTemplates = mergedTemplates.filter((t) => t.isActive !== false);

  // Admin action: Save/Update template
  const saveTemplate = async (tmpl: Partial<ExtendedBackgroundTemplate> & { id: string }) => {
    try {
      const docRef = doc(db, 'aiBackgroundTemplates', tmpl.id);
      const existing = firestoreTemplates.find((t) => t.id === tmpl.id);
      await setDoc(
        docRef,
        {
          ...tmpl,
          isActive: tmpl.isActive !== false,
          createdAt: existing?.createdAt || tmpl.createdAt || serverTimestamp(),
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

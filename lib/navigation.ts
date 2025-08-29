import { router } from 'expo-router';

export function pushPath(path: { pathname: string; params?: Record<string, string> }) {
  try {
    router.push(path as any);
  } catch (e) {
    console.warn('navigation push failed', e);
  }
}

export function navigateToAssessment(localId: string | number) {
  pushPath({ pathname: '/(root)/assessment/[id]', params: { id: String(localId) } });
}

export function navigateToAddAssessment() {
  pushPath({ pathname: '/(root)/assessment/add_assessment' });
}

export default { pushPath, navigateToAssessment, navigateToAddAssessment };

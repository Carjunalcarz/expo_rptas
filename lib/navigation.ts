export function pushPath(path: { pathname: string; params?: Record<string, string> }) {
  try {
    // require lazily to avoid accessing router before navigation context is set
    const r = require('expo-router');
    r?.router?.push(path as any);
  } catch (e) {
    console.warn('navigation push failed', e);
  }
}

export function navigateToAssessment(localId: string | number) {
  try {
    const r = require('expo-router');
    r?.router?.push?.(`/assessment/${String(localId)}`);
  } catch (e) {
    console.warn('navigateToAssessment failed', e);
  }
}

export function navigateToAddAssessment() {
  pushPath({ pathname: '/(root)/assessment/add_assessment' });
}

export function navigateToEditAssessment(id: number | string) {
  pushPath({ pathname: '/(root)/assessment/edit/[id]', params: { id: String(id) } });
}

export function navigateToRemoteAssessments() {
  pushPath({ pathname: '/(root)/assessment/remote' });
}

export function navigateToRemoteAssessment(id: string) {
  pushPath({ pathname: '/(root)/assessment/remote/[id]', params: { id } });
}

export function navigateToEditRemoteAssessment(id: string) {
  pushPath({ pathname: '/(root)/assessment/remote/edit/[id]', params: { id } });
}

export default { pushPath, navigateToAssessment, navigateToAddAssessment, navigateToEditAssessment, navigateToRemoteAssessments, navigateToRemoteAssessment, navigateToEditRemoteAssessment };

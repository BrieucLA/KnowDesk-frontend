import { useState, useCallback } from 'react';
import type { OnboardingData, OnboardingErrors } from '../types';
import { STEPS } from '../types';

interface UseOnboardingReturn {
  stepIndex:   number;
  totalSteps:  number;
  currentStep: typeof STEPS[number];
  data:        OnboardingData;
  errors:      OnboardingErrors;
  isLastStep:  boolean;
  isSubmitting: boolean;

  updateField: (field: keyof OnboardingData, value: OnboardingData[typeof field]) => void;
  goNext:      () => void;
  goBack:      () => void;
  skip:        () => void;
  submit:      () => Promise<void>;
}

function validateStep(stepId: string, data: OnboardingData): OnboardingErrors {
  if (stepId === 'org' && !data.orgName.trim()) {
    return { orgName: 'Le nom de l\'organisation est requis.' };
  }
  if (stepId === 'content' && !data.firstCategory.trim()) {
    return { firstCategory: 'Donnez un nom à votre première catégorie.' };
  }
  return {};
}

/**
 * Drives the 3-step onboarding flow.
 * Each step can be skipped except "org" (step 1).
 *
 * @param onComplete - called after the last step with the collected data
 */
export function useOnboarding(onComplete: (data: OnboardingData) => void): UseOnboardingReturn {
  const [stepIndex,    setStepIndex]    = useState(0);
  const [data,         setData]         = useState<OnboardingData>({ orgName: '', inviteEmails: [], firstCategory: '' });
  const [errors,       setErrors]       = useState<OnboardingErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = STEPS[stepIndex];
  const isLastStep  = stepIndex === STEPS.length - 1;

  const updateField = useCallback(<K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[field as keyof OnboardingErrors]; return next; });
  }, []);

  const goNext = useCallback(() => {
    const stepErrors = validateStep(currentStep.id, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (isLastStep) return;
    setStepIndex(i => i + 1);
  }, [currentStep.id, data, isLastStep]);

  const goBack = useCallback(() => {
    setErrors({});
    setStepIndex(i => Math.max(0, i - 1));
  }, []);

  /** Skip is available on optional steps (team, content) */
  const skip = useCallback(() => {
    setErrors({});
    if (isLastStep) {
      onComplete(data);
      return;
    }
    setStepIndex(i => i + 1);
  }, [isLastStep, data, onComplete]);

  const submit = useCallback(async () => {
    const stepErrors = validateStep(currentStep.id, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Real API: await onboardingApi.complete(data)
      await new Promise(r => setTimeout(r, 800)); // simulate
      onComplete(data);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep.id, data, onComplete]);

  return {
    stepIndex, totalSteps: STEPS.length, currentStep, data, errors,
    isLastStep, isSubmitting,
    updateField, goNext, goBack, skip, submit,
  };
}

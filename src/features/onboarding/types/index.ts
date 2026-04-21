export interface OnboardingStep {
  id:    'org' | 'team' | 'content';
  title: string;
  description: string;
}

export interface OnboardingData {
  orgName:    string;
  inviteEmails: string[]; // validated emails to invite
  firstCategory: string;
}

export interface OnboardingErrors {
  orgName?:      string;
  inviteEmails?: string;
  firstCategory?: string;
}

export const STEPS: OnboardingStep[] = [
  { id: 'org',     title: 'Votre organisation',  description: 'Donnez un nom à votre espace.' },
  { id: 'team',    title: 'Inviter l\'équipe',    description: 'Optionnel — vous pouvez le faire plus tard.' },
  { id: 'content', title: 'Première catégorie',  description: 'Organisez vos processus dès le départ.' },
];

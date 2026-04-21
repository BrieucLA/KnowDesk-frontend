export interface AcceptInvitationForm {
  password:        string;
  passwordConfirm: string;
}

export interface AcceptInvitationErrors {
  password?:        string;
  passwordConfirm?: string;
  general?:         string;
}

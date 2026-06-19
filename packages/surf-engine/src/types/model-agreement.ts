export type AgreementLevel = 'agree' | 'caution' | 'diverge' | 'horizon' | 'unavailable';

export interface ModelAgreement {
  level: AgreementLevel;
  /** null when level is 'horizon' or 'unavailable' */
  heightDiffPct: number | null;
  periodDiffS: number | null;
  primaryHeight: number | null;
  secondaryHeight: number | null;
  secondaryModel: 'ecmwf_wam025';
}

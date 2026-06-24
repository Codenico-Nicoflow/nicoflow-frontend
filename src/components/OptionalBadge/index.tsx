import { useTranslation } from 'react-i18next';

// The "(Optional)" hint shown next to optional field labels. Centralized so the
// copy is translated once instead of hardcoded in every field component.
export const OptionalBadge = () => {
  const { t } = useTranslation('common');
  return <span className="text-xs text-muted-foreground font-normal">{t('fields.optional')}</span>;
};

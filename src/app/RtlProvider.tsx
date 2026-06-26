import { DirectionProvider } from '@radix-ui/react-direction';
import { useTranslation } from 'react-i18next';

// Radix primitives default their internal reading direction to 'ltr' regardless
// of <html dir>. That's fine for CSS (logical props inherit dir), but Radix's
// own positioning logic — dropdown/popover `align`, tooltip `side`, slider, etc.
// — keys off this provider, not the DOM. Without it, menus open on the wrong
// side in Hebrew. We drive it from i18n.dir() so it flips with the language.
export const RtlProvider = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const dir = i18n.dir();

  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
};

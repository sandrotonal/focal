import { translations } from '../src/i18n/translations';

describe('i18n translations', () => {
  it('contains valid definitions for both Turkish and English', () => {
    expect(translations.tr).toBeDefined();
    expect(translations.en).toBeDefined();
  });

  it('contains consistent common strings', () => {
    expect(translations.tr.common.appName).toBe('FOCAL');
    expect(translations.en.common.appName).toBe('FOCAL');
    expect(translations.tr.common.minutes).toBe('Dakika');
    expect(translations.en.common.minutes).toBe('Minutes');
  });

  it('contains all accessibility aria labels in both locales', () => {
    const trAria = translations.tr.drawer.aria;
    const enAria = translations.en.drawer.aria;

    expect(trAria.themeSwitch).toBeTruthy();
    expect(enAria.themeSwitch).toBeTruthy();
    expect(trAria.notificationsSwitch).toBeTruthy();
    expect(enAria.notificationsSwitch).toBeTruthy();
    expect(trAria.hapticsSwitch).toBeTruthy();
    expect(enAria.hapticsSwitch).toBeTruthy();
  });

  it('contains onboarding translations in both locales', () => {
    expect(translations.tr.onboarding.slide1.title).toBeTruthy();
    expect(translations.en.onboarding.slide1.title).toBeTruthy();
    expect(translations.tr.onboarding.slide2.title).toBeTruthy();
    expect(translations.en.onboarding.slide2.title).toBeTruthy();
    expect(translations.tr.onboarding.slide3.title).toBeTruthy();
    expect(translations.en.onboarding.slide3.title).toBeTruthy();
  });
});

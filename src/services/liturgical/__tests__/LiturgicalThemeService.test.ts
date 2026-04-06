import { getLiturgicalMoment } from '../LiturgicalThemeService';

describe('getLiturgicalMoment', () => {
  const date = (str: string) => new Date(str);

  describe('Advent', () => {
    it('returns advent on Dec 1 2024', () => {
      const m = getLiturgicalMoment(date('2024-12-01'));
      expect(m.season).toBe('advent');
    });

    it('intensity increases through Advent', () => {
      const early = getLiturgicalMoment(date('2024-12-01'));
      const late = getLiturgicalMoment(date('2024-12-22'));
      expect(late.intensity).toBeGreaterThan(early.intensity);
    });

    it('intensity is between 0 and 1', () => {
      const m = getLiturgicalMoment(date('2024-12-15'));
      expect(m.intensity).toBeGreaterThanOrEqual(0);
      expect(m.intensity).toBeLessThanOrEqual(1);
    });
  });

  describe('Lent', () => {
    it('returns lent on Ash Wednesday 2025 (Mar 5)', () => {
      const m = getLiturgicalMoment(date('2025-03-05'));
      expect(m.season).toBe('lent');
    });

    it('intensity increases through Lent', () => {
      const early = getLiturgicalMoment(date('2025-03-10'));
      const late = getLiturgicalMoment(date('2025-04-10'));
      expect(late.intensity).toBeGreaterThan(early.intensity);
    });
  });

  describe('Holy Week', () => {
    it('returns holy-week on Palm Sunday 2025 (Apr 13)', () => {
      const m = getLiturgicalMoment(date('2025-04-13'));
      expect(m.season).toBe('holy-week');
    });

    it('returns holy-week on Good Friday 2025 (Apr 18)', () => {
      const m = getLiturgicalMoment(date('2025-04-18'));
      expect(m.season).toBe('holy-week');
    });

    it('intensity at peak on Holy Saturday', () => {
      const m = getLiturgicalMoment(date('2025-04-19'));
      expect(m.intensity).toBeCloseTo(1.0, 1);
    });
  });

  describe('Easter', () => {
    it('returns easter on Easter Sunday 2025 (Apr 20)', () => {
      const m = getLiturgicalMoment(date('2025-04-20'));
      expect(m.season).toBe('easter');
    });

    it('returns pentecost on Pentecost 2025 (Jun 8)', () => {
      const m = getLiturgicalMoment(date('2025-06-08'));
      expect(m.season).toBe('pentecost');
    });

    it('intensity builds in final week before Pentecost', () => {
      const beforeFinalWeek = getLiturgicalMoment(date('2025-05-25'));
      const finalWeek = getLiturgicalMoment(date('2025-06-05'));
      expect(finalWeek.intensity).toBeGreaterThan(beforeFinalWeek.intensity);
    });
  });

  describe('Ordinary Time', () => {
    it('returns ordinary-time in July', () => {
      const m = getLiturgicalMoment(date('2025-07-15'));
      expect(m.season).toBe('ordinary-time');
    });

    it('intensity is flat (0.5) in ordinary time', () => {
      const m = getLiturgicalMoment(date('2025-07-15'));
      expect(m.intensity).toBe(0.5);
    });
  });

  describe('label', () => {
    it('returns a non-empty label for every season', () => {
      const dates = [
        '2024-12-01', '2024-12-25', '2025-01-15',
        '2025-03-10', '2025-04-15', '2025-04-20',
        '2025-06-08', '2025-07-15',
      ];
      dates.forEach(d => {
        const m = getLiturgicalMoment(date(d));
        expect(m.label.length).toBeGreaterThan(0);
      });
    });
  });
});

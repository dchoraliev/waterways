import { ALL_TABLES } from '../../packages/shared/src/database/schema';

describe('Shared Schema', () => {
  it('should export ALL_TABLES array', () => {
    expect(ALL_TABLES).toBeDefined();
    expect(Array.isArray(ALL_TABLES)).toBe(true);
    expect(ALL_TABLES.length).toBe(5); // 3 tables + 2 indexes
  });

  it('should contain exactly 3 CREATE TABLE statements', () => {
    const tableStatements = ALL_TABLES.filter((sql) => sql.includes('CREATE TABLE'));
    expect(tableStatements.length).toBe(3); // trips, observations, observation_media
  });

  it('should contain exactly 2 CREATE INDEX statements', () => {
    const indexStatements = ALL_TABLES.filter((sql) => sql.includes('CREATE INDEX'));
    expect(indexStatements.length).toBe(2);
  });

  it('should not contain observation_categories table', () => {
    const hasCategories = ALL_TABLES.some((sql) => sql.includes('observation_categories'));
    expect(hasCategories).toBe(false);
  });
});

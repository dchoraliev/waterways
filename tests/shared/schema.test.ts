import { CREATE_ALL_TABLES } from '../../packages/shared/src/database/schema';

describe('Shared Schema', () => {
  it('should export CREATE_ALL_TABLES array', () => {
    const tableStatements = CREATE_ALL_TABLES.filter((sql: string) => sql.includes('CREATE TABLE'));
    expect(tableStatements.length).toBeGreaterThan(0);
  });

  it('should include index definitions', () => {
    const indexStatements = CREATE_ALL_TABLES.filter((sql: string) => sql.includes('CREATE INDEX'));
    expect(indexStatements.length).toBeGreaterThan(0);
  });

  it('should include observation_media table', () => {
    const hasObservationMedia = CREATE_ALL_TABLES.some((sql: string) =>
      sql.includes('observation_media')
    );
    expect(hasObservationMedia).toBe(true);
  });
});

import { CREATE_ALL_TABLES } from '../../packages/shared/src/database/schema';

describe('schema', () => {
  it('has table definitions', () => {
    const tableStatements = CREATE_ALL_TABLES.filter((sql: string) =>
      sql.includes('CREATE TABLE')
    );
    expect(tableStatements.length).toBeGreaterThan(0);
  });

  it('has index definitions', () => {
    const indexStatements = CREATE_ALL_TABLES.filter((sql: string) =>
      sql.includes('CREATE INDEX')
    );
    expect(indexStatements.length).toBeGreaterThan(0);
  });

  it('includes observation_media table', () => {
    const hasObservationMedia = CREATE_ALL_TABLES.some((sql: string) =>
      sql.includes('observation_media')
    );
    expect(hasObservationMedia).toBe(true);
  });
});

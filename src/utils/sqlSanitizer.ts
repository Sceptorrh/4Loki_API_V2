export const sanitizeSQL = (sql: string): string => {
  // Convert to lowercase for easier checking
  const lowerSQL = sql.toLowerCase();

  // List of dangerous SQL keywords
  const dangerousKeywords = [
    'delete',
    'drop',
    'update',
    'insert',
    'alter',
    'create',
    'truncate',
    'replace',
    'modify',
    'grant',
    'revoke',
    'commit',
    'rollback',
  ];

  // Check for dangerous keywords
  for (const keyword of dangerousKeywords) {
    if (lowerSQL.includes(keyword)) {
      throw new Error(`SQL query contains dangerous keyword: ${keyword}`);
    }
  }

  // Ensure the query starts with SELECT
  if (!lowerSQL.trim().startsWith('select')) {
    throw new Error('Only SELECT queries are allowed');
  }

  // Remove any semicolons to prevent multiple queries
  const sanitizedSQL = sql.replace(/;/g, '');

  return sanitizedSQL;
}; 
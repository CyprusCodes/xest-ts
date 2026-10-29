/**
 * Interface representing the extracted MySQL connection details
 */
export interface MySQLConnectionDetails {
  host: string;
  user: string;
  password?: string;
  database: string;
  port?: number;
}

/**
 * Parses a MySQL connection string (e.g., from Dokku or Heroku)
 * into a structured object for the mysql2 driver.
 * * @param connString - Example: mysql://user:pass@host:3306/db_name
 */
const parseMySQLConnectionString = (
  connString: string
): MySQLConnectionDetails => {
  const parsedURL = new URL(connString);

  return {
    host: parsedURL.hostname,
    user: parsedURL.username,
    password: decodeURIComponent(parsedURL.password),
    database: parsedURL.pathname.slice(1), // Removes the leading slash
    port: parsedURL.port ? Number(parsedURL.port) : 3306
  };
};

export default parseMySQLConnectionString;

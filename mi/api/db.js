// Set up MySQL db 
const db  = mysql.createConnection({
    host: 'localhost',         // MySQL server host (localhost or IP address)
    user: 'root',              // MySQL username
    password: 'root',      // MySQL password
    database: 'test',  // MySQL database name
  });
  
  db .connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
      return;
    }
    console.log('Connected to the MySQL database as ID ' + db .threadId);
  });
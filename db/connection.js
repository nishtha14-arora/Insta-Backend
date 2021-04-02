// npm instal mysql

const mysql      = require('mysql');
const connection = mysql.createPool({
  connectionLimit:10,
  host     : 'blkhr3x8qq08iancsn7g-mysql.services.clever-cloud.com',
  user     : 'ukhqhujml7legrlk',
  password : 'USWWOyjK72h5sGFLpIGu',
  database : 'blkhr3x8qq08iancsn7g'
});
 
// connection.connect();
 

// Connection is a sql function. 


// export this connection file to app.js 
module.exports=connection;
 

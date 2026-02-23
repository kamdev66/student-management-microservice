const bcrypt = require('bcryptjs');

bcrypt.compare("kamdev@123", "$2a$10$jCke1KCUDQeSAgroqQanuu.AGYIrgXp8W6pGgQbogSCpQxYIFWPuC")
  .then(console.log);
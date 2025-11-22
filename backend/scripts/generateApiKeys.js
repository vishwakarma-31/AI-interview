const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Function to generate a secure API key
const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Function to update .env file with new API keys
const updateEnvFile = () => {
  const envPath = path.join(__dirname, '../.env');
  
  // Read the current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Generate new API keys
  const apiKey1 = generateApiKey();
  const apiKey2 = generateApiKey();
  const apiKey3 = generateApiKey();
  
  // Replace or add API key entries
  const apiKeyPattern1 = /^API_KEY_1=.*/m;
  const apiKeyPattern2 = /^API_KEY_2=.*/m;
  const apiKeyPattern3 = /^API_KEY_3=.*/m;
  
  if (envContent.match(apiKeyPattern1)) {
    envContent = envContent.replace(apiKeyPattern1, `API_KEY_1=${apiKey1}`);
  } else {
    envContent = envContent.replace(
      '# API Keys (for backend service authentication)',
      `# API Keys (for backend service authentication)\nAPI_KEY_1=${apiKey1}`
    );
  }
  
  if (envContent.match(apiKeyPattern2)) {
    envContent = envContent.replace(apiKeyPattern2, `API_KEY_2=${apiKey2}`);
  } else {
    envContent = envContent.replace(
      'API_KEY_1=your_api_key_1_here_change_this_in_production',
      `API_KEY_1=your_api_key_1_here_change_this_in_production\nAPI_KEY_2=${apiKey2}`
    );
  }
  
  if (envContent.match(apiKeyPattern3)) {
    envContent = envContent.replace(apiKeyPattern3, `API_KEY_3=${apiKey3}`);
  } else {
    envContent = envContent.replace(
      'API_KEY_2=your_api_key_2_here_change_this_in_production',
      `API_KEY_2=your_api_key_2_here_change_this_in_production\nAPI_KEY_3=${apiKey3}`
    );
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(envPath, envContent);
  
  console.log('API keys generated and updated in .env file:');
  console.log('API_KEY_1:', apiKey1);
  console.log('API_KEY_2:', apiKey2);
  console.log('API_KEY_3:', apiKey3);
};

// Run the script
updateEnvFile();
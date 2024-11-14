const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;
const { quicktype, InputData, jsonInputForTargetLanguage, JSONSchemaInput, FetchingJSONSchemaStore } = require("quicktype-core");

app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World from Node.js server!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

  
app.use(express.json());
 

app.post('/generatepojo', async (req, res) => {
  const { jsonString, targetLanguage } = req.body;

  // Validate and log input
  console.log("Received JSON Input:", jsonString);
  console.log("Target Language:", targetLanguage);

  if (!jsonString || !targetLanguage) {
    return res.status(400).json({ error: "Missing 'jsonString' or 'targetLanguage' in request body" });
  }

  const jsonInput = jsonInputForTargetLanguage(targetLanguage);
  await jsonInput.addSource({ name: "RootObject", samples: [jsonString] });

  const inputData = new InputData();
  inputData.addInput(jsonInput);

  try {
    const result = await quicktype({
      inputData,
      lang: targetLanguage,
    });
    res.json({ code: result.lines.join('\n') });
  } catch (error) {
    console.error("Error generating POJO:", error);
    res.status(500).json({
      error: 'Error generating POJO',
      details: error.message,
      stack: error.stack
    });
  }
});


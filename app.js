const express = require("express");
const cheerio = require('cheerio');
const app = express();
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const https = require("https");

/**
 * @swagger
 * components:
 *   schemas:
 *      NameUrl:
 *       type: object
 *       required:
 *         - name
 *         - url
 *       properties:
 *         name:
 *           type: string
 *         url:
 *           type: string
 *              
 *              
 */

const port = process.env.PORT || 5000;
getWikileaks("https://wikileaks.org/-Leaks-.html", addLeaks);
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
      info: {
        version: "1.0",
        title: "Wikileaks API",
        description: "Wikileaks API Documentation",
        contact: {
          name: "Jeremy Blair"
        },
        servers: ["http://localhost:5000"]
      }
    },
    apis: ["app.js"]
  };


  
  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

/**
 * @swagger
 * /leaks:
 *  get:
 *    summary: Returns a list of all document collections
 *    responses:
 *      '200':
 *        description: An array of key-value-pairs for every document collection and its corresponding URL
 *        content:
 *          application/json:
 *              schema:
 *                  type: array
 *                  items:
 *                      $ref: '#/components/schemas/NameUrl'
 *                      
 *                      
 *        
 */
  app.get("/leaks", (req, res) => {
    res.status(200).send(JSON.stringify(leakArray));
  })

/**
 * @swagger
 * /leak-documents:
 *    get:
 *      summary: Returns a list of documents in a given collection
 *      description: Returns an array of key-value-pairs where the key is the name of the document and the value is the corresponding URL
 *      responses:
 *          '200':
 *              description: Succesfully returned document(s)
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/NameUrl'
 *    parameters:
 *      - name: leakName
 *        in: path
 *        description: Name of document collection
 *        required: true
 *        schema:
 *          type: string
 *          format: string
 *          example: 'Amazon Atlas'
 */
  app.get("/leak-documents/:leakName", (req, res) => {
      var leak = req.params.leakName;
      console.log(leak);
      var documents = [];
      getWikileaks(leaks[leak], function(b){
          let $ = cheerio.load(b);
          $('a').each(function(i, a) {
              console.log($(this).attr('href'));
              if($(this).attr('href') && $(this).attr('href').includes("/document/")){
                  console.log($(this).attr('href'))
                  documents.push({"documentName": $(this).text(), "documentUrl": "https://wikileaks.org" +$(this).attr('href').substring(1)});
              }
          })
          res.status(200).send(JSON.stringify(documents));
      })
  })
  const leaks = {};
  const leakArray = [];

  function addLeaks(body){
    let $ = cheerio.load(body);
    console.log($('li.title').length);
    $("li.tile").each(function(){
        var href = $(this).find('a').attr('href');
        var name = $(this).find('.title').text();
        leaks[name] = href;
        leakArray.push({leakName: name, url: href})
    });
  }


  function getWikileaks(url, callback){
  
    const request = https.request(url, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data = data + chunk.toString();
        });
      
        response.on('end', () => {
            callback(data);
        });
    })
      
    request.on('error', (error) => {
        console.log('An error', error);
    });
    request.end() 
  }


const express = require("express");
const app = express();

app.use(express.urlencoded({
    extended: true
  }));

app.set('view engine', 'ejs');

const CosmosClient = require("@azure/cosmos").CosmosClient;

const port = process.env.PORT || 80

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const client = new CosmosClient({
    endpoint: 'https://ucu-cosmos.documents.azure.com:443/', 
    key: 'RpOHIc69YQOhFxduKMdF8K23AHU2XTRjTu5F3elwhTtX7Y3AuY33wZPGpX8CickBON3zIc7m3H7S4RrqUarQaw==',
    });

const databaseId = 'ucu-db'
const containerId = 'food-cnt'
var lst = []

const db = client.database(databaseId);
const container = db.container(containerId);

async function setup(){
  lst = []
  const { resources } = await container.items
    .query("SELECT * from c")
    .fetchAll();

  for (const product of resources) {
    lst.push({id:product.id, prod: product.prod, amnt: product.amnt})
  }
}

setup()

app.get("/", (request, response) => {
    response.render('index.ejs', {prods: lst});
});

app.post('/submit-form', (req, res) => {
    var product = req.body
    product.id = lst.length > 0 ? (parseInt(lst[lst.length - 1].id) + 1).toString() : "0"
    container.items.create(product)

    lst.push(product)
    console.log(product);
    res.redirect('/');
  })

app.post('/delete-form', async (req, res) => {
    console.log(req.body);

    await container.item(req.body.id.toString()).delete();
    await setup()
    console.log(req.body);

    res.redirect('/');
  })

app.post('/modify-form', async (req, res) => {
    var product = lst.filter(x => x.id == req.body.id)
    if (product.length == 0)
      return

    product = product[0]
    product.amnt = req.body.amnt

    await container.item(product.id).replace(product);
    await setup()

    console.log(req.body);
    // res.end()
    res.redirect('/');
  })


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Mock database
let products = [
  { id: 1, name: 'Blue Shirt', type: 'clothes', price: 200, category:'Mens' },
  { id: 2, name: 'Product B', type: 'Home Decor', price: 1500, category:'Decorative item' },
];

// Update product endpoint
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  
  let product = products.find((p) => p.id === parseInt(id));

  if (!product) {
    return res.status(404).send('Product not found');
  }

  product = { ...product, ...updatedData }; // Update product info
  products = products.map((p) => (p.id === parseInt(id) ? product : p)); // Replace updated product in the array

  res.json(product); // Send back updated product
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

const express = require('express');
const app = express();
const port = 3000;

// Sample product data (this could be connected to a real database)
let products = [
    { id: 1, name: 'Laptop', price: '999.99', image: 'https://via.placeholder.com/200', type: 'electronics' },
    { id: 2, name: 'Smartphone', price: '699.99', image: 'https://via.placeholder.com/200', type: 'electronics' },
    { id: 3, name: 'Headphones', price: '199.99', image: 'https://via.placeholder.com/200', type: 'electronics' },
    { id: 4, name: 'Watch', price: '150.00', image: 'https://via.placeholder.com/200', type: 'electronics' },
    { id: 5, name: 'Sofa', price:'4300', image:'image/4.jpg',type:'home decor',},
    { id: 6, name: 'Comfy Couch', price:'4500', image:'image/5.png',type:'home decor'},
    { id: 7, name: 'Couch', price:'4000', image:'image/6.jpg',type:'home decor',},
    { id: 8, name: 'Lamp', price:'540', image:'image/7.jpg',type:'home decor',},
    { id: 9, name: 'Dress', price:'780', image:'image/11.png',type:'clothes',},
    { id: 10, name: 'Iphone(Pink)', price:'8800', image:'image/8.png',type:'electronics',},
    { id: 11, name: 'Iphone(Yellow)', price:'8900', image:'image/9.png',type:'electronics',},
    { id: 12, name: 'Flip-Phone', price:'9800.12', image:'image/10.jpg',type:'electronics',}
];

// DELETE product route
app.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  products = products.filter(product => product.id !== parseInt(id));
  res.status(200).json({ message: 'Product deleted successfully' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

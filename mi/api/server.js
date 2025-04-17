import express from'express';
import mysql from'mysql2';
import bodyParser from'body-parser';
import cors from'cors';

const app = express();
const port = 5000;

// MySQL connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'test'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API to get products
app.get('/products', (req, res) => {
    db.query('SELECT * FROM add_product', (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

// API to add product to cart
app.post('/cart', (req, res) => {
    const { user_id } = req.params;
    const { product_id, quantity } = req.body;
    const query = 'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)';
    db.query(query, [user_id, product_id, quantity], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json({ message: 'Product added to cart', cartId: result.insertId });
        }
    });
});

// API to get cart items
app.get('/cart/:user_id', (req, res) => {
    const { user_id } = req.params;
    const query = `
        SELECT p.name, p.price, c.quantity
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        WHERE c.user_id = ?
    `;
    db.query(query, [user_id], (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

// API to checkout
app.post('/checkout', (req, res) => {
    
    //const  user_id  = req.session.user.id;
    const { total_price , user_id } = req.body;

    // Create order
    const query = 'INSERT INTO orders (user_id, total_price) VALUES (?, ?)';
    db.query(query, [user_id, total_price], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const order_id = result.insertId;

            // Insert order items
            const cartQuery = 'SELECT * FROM cart WHERE user_id = ?';
            db.query(cartQuery, [user_id], (err, cartItems) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    const orderItems = cartItems.map(item => {
                        return [
                            order_id, 
                            item.product_id, 
                            item.quantity, 
                            item.total_price
                        ];
                    });

                    const orderItemsQuery = 'INSERT INTO order_items (order_id, product_id, quantity, total_price) VALUES ?';
                    db.query(orderItemsQuery, [orderItems], (err) => {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            // Clear cart after checkout
                            db.query('DELETE FROM cart WHERE user_id = ?', [user_id], (err) => {
                                if (err) {
                                    res.status(500).send(err);
                                } else {
                                    res.json({ message: 'Checkout successful', order_id });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

app.listen(7000, () => {
    console.log(`Server running on  meow http://localhost:${port}`);
});
